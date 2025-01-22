import {
    type Account,
    type Address,
    type Assign,
    type Chain,
    type Client,
    type Hex,
    type LocalAccount,
    type OneOf,
    type Transport,
    type WalletClient,
    hashMessage,
    hashTypedData
} from "viem"
import { getChainId, signMessage } from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"

import {
    type SmartAccount,
    type SmartAccountImplementation,
    type UserOperation,
    entryPoint06Abi,
    entryPoint06Address,
    getUserOperationHash,
    toSmartAccount
} from "viem/account-abstraction"
import { getAction } from "viem/utils"
import { getSenderAddress } from "../../actions/public/getSenderAddress.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"
import { decodeCallData } from "./utils/decodeCallData.js"
import { encodeCallData } from "./utils/encodeCallData.js"
import { getFactoryData } from "./utils/getFactoryData.js"

async function _signTypedData(
    signer: LocalAccount,
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

export type ToTrustSmartAccountParameters = {
    client: Client
    owner: OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >
    factoryAddress?: Address
    entryPoint: {
        address: Address
        version: "0.6"
    }
    index?: bigint
    address?: Address
    secp256k1VerificationFacetAddress?: Address
    nonceKey?: bigint
}

export type TrustSmartAccountImplementation = Assign<
    SmartAccountImplementation<
        typeof entryPoint06Abi,
        "0.6"
        // {
        //     // entryPoint === ENTRYPOINT_ADDRESS_V06 ? "0.2.2" : "0.3.0-beta"
        //     abi: entryPointVersion extends "0.6" ? typeof BiconomyAbi
        //     factory: { abi: typeof FactoryAbi; address: Address }
        // }
    >,
    { sign: NonNullable<SmartAccountImplementation["sign"]> }
>

export type ToTrustSmartAccountReturnType =
    SmartAccount<TrustSmartAccountImplementation>

/**
 * @description Creates an Trust Smart Account from a private key.
 *
 * @returns A Private Key Trust Smart Account.
 */
export async function toTrustSmartAccount(
    parameters: ToTrustSmartAccountParameters
): Promise<ToTrustSmartAccountReturnType> {
    const {
        owner,
        client,
        index = 0n,
        address,
        factoryAddress = TRUST_ADDRESSES.factoryAddress,
        secp256k1VerificationFacetAddress = TRUST_ADDRESSES.secp256k1VerificationFacetAddress
    } = parameters

    const localOwner = await toOwner({ owner })

    let accountAddress: Address | undefined = address

    const entryPoint = {
        address: parameters.entryPoint?.address ?? entryPoint06Address,
        abi: entryPoint06Abi,
        version: parameters.entryPoint?.version ?? "0.6"
    } as const

    let chainId: number

    const getMemoizedChainId = async () => {
        if (chainId) return chainId
        chainId = client.chain
            ? client.chain.id
            : await getAction(client, getChainId, "getChainId")({})
        return chainId
    }

    const getFactoryArgs = async () => {
        return {
            factory: factoryAddress,
            factoryData: await getFactoryData({
                bytes: localOwner.address,
                secp256k1VerificationFacetAddress,
                index
            })
        }
    }

    return toSmartAccount({
        client,
        entryPoint,
        getFactoryArgs,
        async getAddress() {
            if (accountAddress) return accountAddress

            const { factory, factoryData } = await getFactoryArgs()

            // Get the sender address based on the init code
            accountAddress = await getSenderAddress(client, {
                factory,
                factoryData,
                entryPointAddress: entryPoint.address
            })

            return accountAddress
        },
        async encodeCalls(calls) {
            return encodeCallData(calls)
        },
        async decodeCalls(callData) {
            return decodeCallData(callData)
        },
        async getNonce(args) {
            return getAccountNonce(client, {
                address: await this.getAddress(),
                entryPointAddress: entryPoint.address,
                key: parameters?.nonceKey ?? args?.key
            })
        },
        async getStubSignature() {
            return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        async signMessage({ message }) {
            return _signTypedData(
                localOwner,
                await getMemoizedChainId(),
                await this.getAddress(),
                hashMessage(message)
            )
        },
        async signTypedData(typedData) {
            return _signTypedData(
                localOwner,
                await getMemoizedChainId(),
                await this.getAddress(),
                hashTypedData(typedData)
            )
        },
        async signUserOperation(parameters) {
            const { chainId = await getMemoizedChainId(), ...userOperation } =
                parameters

            return signMessage(client, {
                account: localOwner,
                message: {
                    raw: getUserOperationHash({
                        userOperation: {
                            ...userOperation,
                            sender:
                                userOperation.sender ??
                                (await this.getAddress()),
                            signature: "0x"
                        } as UserOperation<"0.6">,
                        entryPointAddress: entryPoint.address,
                        entryPointVersion: entryPoint.version,
                        chainId: chainId
                    })
                }
            })
        }
    }) as Promise<ToTrustSmartAccountReturnType>
}
