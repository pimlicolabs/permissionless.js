import {
    type Address,
    type Chain,
    type Client,
    type LocalAccount,
    type Transport,
    type TypedData,
    type TypedDataDefinition,
    concatHex
} from "viem"
import { getChainId } from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce"

import { toSmartAccount } from "../toSmartAccount"
import {
    SignTransactionNotSupportedBySmartAccount,
    type SmartAccount,
    type SmartAccountSigner
} from "../types"

import type { EntryPoint, Prettify } from "../../types"
import { isSmartAccountDeployed } from "../../utils/isSmartAccountDeployed"

import { encodeCallData } from "./utils/encodeCallData"
import { getAccountAddress } from "./utils/getAccountAddress"
import { getDummySignature } from "./utils/getDummySignature"
import { getFactoryData } from "./utils/getFactoryData"
import { signMessage } from "./utils/signMessage"
import { signTransaction } from "./utils/signTransaction"
import { signTypedData } from "./utils/signTypedData"
import { signUserOperation } from "./utils/signUserOperation"

/**
 * Default addresses for Trust Smart Account
 */
export const TRUST_ADDRESSES: {
    Secp256k1VerificationFacetAddress: Address
} = {
    Secp256k1VerificationFacetAddress:
        "0x03F82FA254B123282542Efc2b477f30ADD2Ca111"
}

export type TrustSmartAccount<
    entryPoint extends EntryPoint,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<entryPoint, "TrustSmartAccount", transport, chain>

export type SignerToTrustSmartAccountParameters<
    entryPoint extends EntryPoint,
    TSource extends string = string,
    TAddress extends Address = Address
> = Prettify<{
    signer: SmartAccountSigner<TSource, TAddress>
    factoryAddress: Address
    entryPoint: entryPoint
    index?: bigint
    address?: Address
}>

/**
 * @description Creates an Trust Smart Account from a private key.
 *
 * @returns A Private Key Trust Smart Account.
 */
export async function signerToTrustSmartAccount<
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address
>(
    client: Client<TTransport, TChain, undefined>,
    {
        signer,
        factoryAddress,
        entryPoint: entryPointAddress,
        index = 0n,
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
                entryPoint: entryPointAddress,
                bytes: viemSigner.publicKey,
                owner: viemSigner.address,
                index
            }),
        getChainId(client)
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

        signMessage: ({ message }) =>
            signMessage(client, { account: viemSigner, message }),
        signTransaction: signTransaction,
        signTypedData: <
            const TTypedData extends TypedData | Record<string, unknown>,
            TPrimaryType extends
                | keyof TTypedData
                | "EIP712Domain" = keyof TTypedData
        >(
            typedData: TypedDataDefinition<TTypedData, TPrimaryType>
        ) =>
            signTypedData<TTypedData, TPrimaryType>(client, {
                account: viemSigner,
                ...typedData
            }),
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
                    account: viemSigner,
                    bytes: viemSigner.publicKey,
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
                account: viemSigner,
                bytes: viemSigner.publicKey,
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
