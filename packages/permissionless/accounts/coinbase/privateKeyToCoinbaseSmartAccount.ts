import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type PublicActions,
    type Transport,
    type TypedData,
    type TypedDataDefinition,
    concatHex,
    encodeFunctionData,
    hashMessage
} from "viem"
import { sign } from "viem/accounts"
import { getChainId } from "viem/actions"
import type { Prettify } from "viem/chains"
import { toSmartAccount } from "../../accounts"
import { getAccountNonce } from "../../actions/public/getAccountNonce"
import type { EntryPoint } from "../../types/entrypoint"
import {
    getEntryPointVersion,
    getUserOperationHash,
    isSmartAccountDeployed
} from "../../utils"
import {
    SignTransactionNotSupportedBySmartAccount,
    type SmartAccount
} from "../types"
import { CoinbaseSmartWalletAbi } from "./abi/CoinbaseSmartWalletAbi"
import { COINBASE_SMART_WALLET_FACTORY_ADDRESS } from "./constants"
import { buildSignatureWrapperForEOA } from "./utils/buildSignatureWrapperForEOA"
import { getAccountAddress } from "./utils/getAccountAddress"
import { getAccountInitCode } from "./utils/getAccountInitCode"
import { replaySafeHash } from "./utils/replaySafeHash"

export type CoinbaseSmartAccount<
    entryPoint extends EntryPoint,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<entryPoint, "CoinbaseSmartAccount", transport, chain>

type SignersToCoinbaseSmartWalletAccountParameters<
    entryPoint extends EntryPoint
> = Prettify<{
    privateKey: Hex
    ownerIndex: bigint
    initialOwners: Address[]
    factoryAddress: Address
    entryPoint: entryPoint
    index?: bigint
    address?: Address
}>

export async function privateKeyToCoinbaseSmartAccount<
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, undefined, undefined, PublicActions>,
    {
        privateKey,
        ownerIndex,
        initialOwners,
        factoryAddress,
        entryPoint: entryPointAddress,
        index = 0n,
        address
    }: SignersToCoinbaseSmartWalletAccountParameters<entryPoint>
): Promise<CoinbaseSmartAccount<entryPoint, TTransport, TChain>> {
    if (getEntryPointVersion(entryPointAddress) !== "v0.6") {
        throw new Error(
            "CoinbaseSmartAccount does not yet support EntryPoint v0.7"
        )
    }

    const [accountAddress, chainId] = await Promise.all([
        address ??
            getAccountAddress<entryPoint, TTransport, TChain>({
                client,
                factoryAddress,
                entryPoint: entryPointAddress,
                owners: initialOwners,
                index
            }),
        getChainId(client)
    ])

    let smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
    )

    return toSmartAccount({
        address: accountAddress,
        signMessage: async ({ message }) => {
            //
            let factoryCalldata: Hex = "0x"
            if (!smartAccountDeployed) {
                factoryCalldata = await getAccountInitCode(initialOwners, index)
            }

            // https://github.com/coinbase/smart-wallet/blob/main/src/ERC1271.sol#L69
            const hash = await replaySafeHash(client, {
                hash: hashMessage(message),
                account: accountAddress,
                factory: COINBASE_SMART_WALLET_FACTORY_ADDRESS,
                factoryCalldata
            })

            const signature = await sign({
                hash,
                privateKey
            })

            // https://github.com/coinbase/smart-wallet/blob/main/src/CoinbaseSmartWallet.sol#L297
            const signatureWrapper = buildSignatureWrapperForEOA({
                signature,
                ownerIndex: 0n
            })

            return signatureWrapper
        },
        signTransaction: (_, __) => {
            throw new SignTransactionNotSupportedBySmartAccount()
        },
        async signTypedData<
            const TTypedData extends TypedData | Record<string, unknown>,
            TPrimaryType extends
                | keyof TTypedData
                | "EIP712Domain" = keyof TTypedData
        >(_typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
            throw new Error(
                "[signerToCoinbaseSmartAccount] Not yet implemented"
            )
        },
        client: client,
        publicKey: accountAddress,
        entryPoint: entryPointAddress,
        source: "CoinbaseSmartAccount",
        async getNonce() {
            return getAccountNonce(client, {
                sender: accountAddress,
                entryPoint: entryPointAddress
            })
        },
        async signUserOperation(userOperation) {
            const hash = getUserOperationHash({
                userOperation,
                entryPoint: entryPointAddress,
                chainId: chainId
            })

            const signature = await sign({
                hash,
                privateKey
            })

            const signatureWrapper = buildSignatureWrapperForEOA({
                signature,
                ownerIndex
            })

            return signatureWrapper
        },
        async getInitCode() {
            if (smartAccountDeployed) return "0x"

            smartAccountDeployed = await isSmartAccountDeployed(
                client,
                accountAddress
            )

            if (smartAccountDeployed) return "0x"

            return concatHex([
                factoryAddress,
                await getAccountInitCode(initialOwners, index)
            ])
        },
        async getFactory() {
            if (smartAccountDeployed) return undefined
            smartAccountDeployed = await isSmartAccountDeployed(
                client,
                accountAddress
            )
            if (smartAccountDeployed) return undefined
            return factoryAddress
        },
        async getFactoryData() {
            if (smartAccountDeployed) return undefined
            smartAccountDeployed = await isSmartAccountDeployed(
                client,
                accountAddress
            )
            if (smartAccountDeployed) return undefined
            return getAccountInitCode(initialOwners, index)
        },
        async encodeDeployCallData(_) {
            throw new Error(
                "CoinbaseSmartAccount does not support account deployment"
            )
        },
        async encodeCallData(args) {
            if (Array.isArray(args)) {
                const argsArray = args as {
                    to: Address
                    value: bigint
                    data: Hex
                }[]

                const calls = argsArray.map((a) => {
                    return {
                        target: a.to,
                        value: a.value,
                        data: a.data
                    }
                })

                return encodeFunctionData({
                    abi: CoinbaseSmartWalletAbi,
                    functionName: "executeBatch",
                    args: [calls]
                })
            }

            const { to, value, data } = args as {
                to: Address
                value: bigint
                data: Hex
            }

            return encodeFunctionData({
                abi: CoinbaseSmartWalletAbi,
                functionName: "execute",
                args: [to, value, data]
            })
        },

        async getDummySignature(_userOperation) {
            return buildSignatureWrapperForEOA({
                signature: {
                    r: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    s: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    v: 0n
                },
                ownerIndex
            })
        }
    })
}
