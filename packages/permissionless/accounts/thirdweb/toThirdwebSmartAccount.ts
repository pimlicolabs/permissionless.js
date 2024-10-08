import type {
    Account,
    Address,
    Assign,
    Chain,
    Client,
    EIP1193Provider,
    LocalAccount,
    OneOf,
    Transport,
    TypedDataDefinition,
    WalletClient
} from "viem"
import { signMessage as viemSignMessage } from "viem/actions"
import { getChainId } from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce"

import {
    type SmartAccount,
    type SmartAccountImplementation,
    type UserOperation,
    entryPoint06Abi,
    entryPoint07Abi,
    entryPoint07Address,
    getUserOperationHash,
    toSmartAccount
} from "viem/account-abstraction"
import { getAction, toHex } from "viem/utils"
import { toOwner } from "../../utils/toOwner"
import { encodeCallData } from "./utils/encodeCallData"
import { getAccountAddress } from "./utils/getAccountAddress"
import { getFactoryData } from "./utils/getFactoryData"
import { signMessage } from "./utils/signMessage"
import { signTypedData } from "./utils/signTypedData"

/**
 * Default addresses for Thirdweb Smart Account
 */
export const THIRDWEB_ADDRESSES: {
    factoryAddressV0_6: Address
    factoryAddressV0_7: Address
} = {
    factoryAddressV0_6: "0x85e23b94e7F5E9cC1fF78BCe78cfb15B81f0DF00",
    factoryAddressV0_7: "0x4be0ddfebca9a5a4a617dee4dece99e7c862dceb"
}

export type ToThirdwebSmartAccountParameters = {
    client: Client
    owner: OneOf<
        | EIP1193Provider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >
    factoryAddress?: Address
    entryPoint: {
        address: Address
        version: "0.6" | "0.7"
    }
    salt?: string
    address?: Address
    secp256k1VerificationFacetAddress?: Address
    nonceKey?: bigint
}

export type ThirdwebSmartAccountImplementation = Assign<
    SmartAccountImplementation<typeof entryPoint07Abi, "0.7">,
    { sign: NonNullable<SmartAccountImplementation["sign"]> }
>

export type ToThirdwebSmartAccountReturnType =
    SmartAccount<ThirdwebSmartAccountImplementation>

/**
 * @description Creates a Thirdweb Smart Account from a private key.
 *
 * @returns A Private Key Thirdweb Smart Account.
 */
export async function toThirdwebSmartAccount(
    parameters: ToThirdwebSmartAccountParameters
): Promise<ToThirdwebSmartAccountReturnType> {
    const entryPoint = {
        address: parameters.entryPoint?.address ?? entryPoint07Address,
        abi:
            parameters.entryPoint?.version === "0.6"
                ? entryPoint06Abi
                : entryPoint07Abi,
        version: parameters.entryPoint?.version ?? "0.7"
    } as const

    const {
        owner,
        client,
        salt,
        address,
        factoryAddress = entryPoint.version === "0.7"
            ? THIRDWEB_ADDRESSES.factoryAddressV0_7
            : THIRDWEB_ADDRESSES.factoryAddressV0_6
    } = parameters

    const admin = await toOwner({ owner })

    let accountAddress: Address | undefined = address

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
                admin: admin.address,
                salt: salt ? toHex(salt) : "0x"
            })
        }
    }

    return toSmartAccount({
        client,
        entryPoint,
        getFactoryArgs,
        async getAddress() {
            if (accountAddress) return accountAddress

            accountAddress = await getAccountAddress(client, {
                adminAddress: admin.address,
                factoryAddress,
                salt: salt ? toHex(salt) : "0x"
            })

            return accountAddress
        },
        async encodeCalls(calls) {
            return encodeCallData(calls)
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
            return signMessage({
                admin,
                chainId: await getMemoizedChainId(),
                accountAddress: await this.getAddress(),
                message
            })
        },
        async signTypedData(typedData) {
            return signTypedData({
                admin,
                chainId: await getMemoizedChainId(),
                accountAddress: await this.getAddress(),
                ...(typedData as TypedDataDefinition)
            })
        },
        async signUserOperation(parameters) {
            const { chainId = await getMemoizedChainId(), ...userOperation } =
                parameters

            return viemSignMessage(client, {
                account: admin,
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
    }) as Promise<ToThirdwebSmartAccountReturnType>
}
