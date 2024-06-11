import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type LocalAccount,
    type Transport,
    type TypedData,
    type TypedDataDefinition,
    concatHex,
    hashMessage,
    hashTypedData
} from "viem"
import { getChainId } from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce"

import { toSmartAccount } from "../toSmartAccount"
import {
    SignTransactionNotSupportedBySmartAccount,
    type SmartAccount,
    type SmartAccountSigner
} from "../types"

import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "../../types"
import { isSmartAccountDeployed } from "../../utils/isSmartAccountDeployed"

import { encodeCallData } from "./utils/encodeCallData"
import { getAccountAddress } from "./utils/getAccountAddress"
import { getDummySignature } from "./utils/getDummySignature"
import { getFactoryData } from "./utils/getFactoryData"
import { signTransaction } from "./utils/signTransaction"
import { signUserOperation } from "./utils/signUserOperation"

async function _signTypedData<
    TSource extends string = string,
    TAddress extends Address = Address
>(
    signer: SmartAccountSigner<TSource, TAddress>,
    chainId: number,
    accountAddress: Address,
    hashedMessage: Hex
): Promise<Hex> {
    return signer.signTypedData({
        domain: {
            chainId: Number(chainId),
            name: "Barz",
            verifyingContract: accountAddress,
            version: "v0.2.0"
        },
        types: {
            BarzMessage: [{ name: "message", type: "bytes" }]
        },
        message: {
            message: hashedMessage
        },
        primaryType: "BarzMessage"
    })
}

/**
 * Default addresses for Trust Smart Account
 */
export const TRUST_ADDRESSES: {
    secp256k1VerificationFacetAddress: Address
    factoryAddress: Address
} = {
    secp256k1VerificationFacetAddress:
        "0x81b9E3689390C7e74cF526594A105Dea21a8cdD5",
    factoryAddress: "0x729c310186a57833f622630a16d13f710b83272a"
}

export type TrustSmartAccount<
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<entryPoint, "TrustSmartAccount", transport, chain>

export type SignerToTrustSmartAccountParameters<
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE,
    TSource extends string = string,
    TAddress extends Address = Address
> = {
    signer: SmartAccountSigner<TSource, TAddress>
    factoryAddress?: Address
    entryPoint: entryPoint
    index?: bigint
    address?: Address
    secp256k1VerificationFacetAddress?: Address
}

/**
 * @description Creates an Trust Smart Account from a private key.
 *
 * @returns A Private Key Trust Smart Account.
 */
export async function signerToTrustSmartAccount<
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address
>(
    client: Client<TTransport, TChain, undefined>,
    {
        signer,
        factoryAddress = TRUST_ADDRESSES.factoryAddress,
        entryPoint: entryPointAddress,
        index = 0n,
        secp256k1VerificationFacetAddress = TRUST_ADDRESSES.secp256k1VerificationFacetAddress,
        address
    }: SignerToTrustSmartAccountParameters<entryPoint, TSource, TAddress>
): Promise<TrustSmartAccount<entryPoint, TTransport, TChain>> {
    const viemSigner: LocalAccount<string> = {
        ...signer,
        signTransaction: (_, __) => {
            throw new SignTransactionNotSupportedBySmartAccount()
        }
    }

    const [accountAddress, chainId] = await Promise.all([
        address ??
            getAccountAddress(client, {
                factoryAddress,
                secp256k1VerificationFacetAddress,
                entryPoint: entryPointAddress,
                bytes: viemSigner.publicKey,
                index
            }),
        client.chain?.id ?? getChainId(client)
    ])

    if (!accountAddress) throw new Error("Account address not found")

    let smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
    )

    return toSmartAccount({
        address: accountAddress,
        client: client,
        publicKey: accountAddress,
        entryPoint: entryPointAddress,
        source: "TrustSmartAccount",
        signMessage: ({ message }) => {
            return _signTypedData<TSource, TAddress>(
                signer,
                chainId,
                accountAddress,
                hashMessage(message)
            )
        },
        signTransaction: signTransaction,
        signTypedData<
            const TTypedData extends TypedData | Record<string, unknown>,
            TPrimaryType extends
                | keyof TTypedData
                | "EIP712Domain" = keyof TTypedData
        >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
            return _signTypedData<TSource, TAddress>(
                signer,
                chainId,
                accountAddress,
                hashTypedData(typedData)
            )
        },
        getNonce: async () => {
            return getAccountNonce(client, {
                sender: accountAddress,
                entryPoint: entryPointAddress
            })
        },
        signUserOperation: async (userOperation) => {
            return signUserOperation(client, {
                account: viemSigner,
                userOperation,
                entryPoint: entryPointAddress,
                chainId: chainId
            })
        },
        getInitCode: async () => {
            smartAccountDeployed =
                smartAccountDeployed ||
                (await isSmartAccountDeployed(client, accountAddress))

            if (smartAccountDeployed) {
                return "0x"
            }

            return concatHex([
                factoryAddress,
                await getFactoryData({
                    bytes: viemSigner.publicKey,
                    secp256k1VerificationFacetAddress,
                    index
                })
            ])
        },
        async getFactory() {
            smartAccountDeployed =
                smartAccountDeployed ||
                (await isSmartAccountDeployed(client, accountAddress))

            if (smartAccountDeployed) return undefined

            return factoryAddress
        },
        async getFactoryData() {
            smartAccountDeployed =
                smartAccountDeployed ||
                (await isSmartAccountDeployed(client, accountAddress))

            if (smartAccountDeployed) return undefined

            return getFactoryData({
                bytes: viemSigner.publicKey,
                secp256k1VerificationFacetAddress,
                index
            })
        },
        async encodeDeployCallData(_) {
            throw new Error("Trust account doesn't support account deployment")
        },
        async encodeCallData(args) {
            return encodeCallData({ args })
        },
        async getDummySignature(userOperation) {
            return getDummySignature(userOperation)
        }
    })
}
