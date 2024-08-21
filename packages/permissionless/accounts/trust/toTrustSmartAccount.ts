import {
    type Address,
    type Assign,
    type Client,
    type Hex,
    type LocalAccount,
    hashMessage,
    hashTypedData
} from "viem"
import { getChainId, signMessage } from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce"

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
import { encodeCallData } from "./utils/encodeCallData"
import { getAccountAddress } from "./utils/getAccountAddress"
import { getFactoryData } from "./utils/getFactoryData"

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

export type ToTrustSmartAccountParameters<
    entryPointVersion extends "0.6" = "0.6",
    entryPointAbi extends typeof entryPoint06Abi = typeof entryPoint06Abi
> = {
    client: Client
    owner: LocalAccount
    factoryAddress?: Address
    entryPoint?: {
        address: typeof entryPoint06Address
        abi: entryPointAbi
        version: entryPointVersion
    }
    index?: bigint
    address?: Address
    secp256k1VerificationFacetAddress?: Address
    nonceKey?: bigint
}

export type TrustSmartAccountImplementation<
    entryPointVersion extends "0.6" = "0.6",
    entryPointAbi extends typeof entryPoint06Abi = typeof entryPoint06Abi
> = Assign<
    SmartAccountImplementation<
        entryPointAbi,
        entryPointVersion
        // {
        //     // entryPoint === ENTRYPOINT_ADDRESS_V06 ? "0.2.2" : "0.3.0-beta"
        //     abi: entryPointVersion extends "0.6" ? typeof BiconomyAbi
        //     factory: { abi: typeof FactoryAbi; address: Address }
        // }
    >,
    { sign: NonNullable<SmartAccountImplementation["sign"]> }
>

export type ToTrustSmartAccountReturnType<
    entryPointVersion extends "0.6" = "0.6",
    entryPointAbi extends typeof entryPoint06Abi = typeof entryPoint06Abi
> = SmartAccount<
    TrustSmartAccountImplementation<entryPointVersion, entryPointAbi>
>

/**
 * @description Creates an Trust Smart Account from a private key.
 *
 * @returns A Private Key Trust Smart Account.
 */
export async function toTrustSmartAccount<
    entryPointVersion extends "0.6" = "0.6",
    entryPointAbi extends typeof entryPoint06Abi = typeof entryPoint06Abi
>(
    parameters: ToTrustSmartAccountParameters<entryPointVersion, entryPointAbi>
): Promise<ToTrustSmartAccountReturnType<entryPointVersion, entryPointAbi>> {
    const {
        owner,
        client,
        index = 0n,
        address,
        factoryAddress = TRUST_ADDRESSES.factoryAddress,
        secp256k1VerificationFacetAddress = TRUST_ADDRESSES.secp256k1VerificationFacetAddress
    } = parameters

    let accountAddress: Address

    const entryPoint = {
        address: parameters.entryPoint?.address ?? entryPoint06Address,
        abi: parameters.entryPoint?.abi ?? entryPoint06Abi,
        version: parameters.entryPoint?.version ?? "0.6"
    } as const

    const getAddress = async () => {
        if (accountAddress) return accountAddress
        accountAddress =
            address ??
            (await getAccountAddress(client, {
                factoryAddress,
                secp256k1VerificationFacetAddress,
                entryPoint: entryPoint.address,
                bytes: owner.address,
                index
            }))
        return accountAddress
    }

    let chainId: number

    const getMemoizedChainId = async () => {
        if (chainId) return chainId
        chainId = client.chain
            ? client.chain.id
            : await getAction(client, getChainId, "getChainId")({})
        return chainId
    }

    return toSmartAccount({
        client,
        entryPoint,
        getAddress,
        async encodeCalls(calls) {
            return encodeCallData(calls)
        },
        async getFactoryArgs() {
            return {
                factory: factoryAddress,
                factoryData: await getFactoryData({
                    bytes: owner.address,
                    secp256k1VerificationFacetAddress,
                    index
                })
            }
        },
        async getNonce(args) {
            return getAccountNonce(client, {
                address: await getAddress(),
                entryPointAddress: entryPoint.address,
                key: args?.key ?? parameters?.nonceKey
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
                owner,
                await getMemoizedChainId(),
                await getAddress(),
                hashMessage(message)
            )
        },
        async signTypedData(typedData) {
            return _signTypedData(
                owner,
                await getMemoizedChainId(),
                await getAddress(),
                hashTypedData(typedData)
            )
        },
        async signUserOperation(parameters) {
            const { chainId = await getMemoizedChainId(), ...userOperation } =
                parameters

            return signMessage(client, {
                account: owner,
                message: {
                    raw: getUserOperationHash({
                        userOperation: {
                            ...userOperation,
                            sender:
                                userOperation.sender ?? (await getAddress()),
                            signature: "0x"
                        } as UserOperation<entryPointVersion>,
                        entryPointAddress: entryPoint.address,
                        entryPointVersion: entryPoint.version,
                        chainId: chainId
                    })
                }
            })
        }
    }) as Promise<
        ToTrustSmartAccountReturnType<entryPointVersion, entryPointAbi>
    >
}
