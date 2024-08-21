import {
    type Address,
    type Assign,
    type Client,
    type Hex,
    type LocalAccount,
    concatHex,
    encodeFunctionData
} from "viem"
import {
    type SmartAccount,
    type SmartAccountImplementation,
    type UserOperation,
    entryPoint06Abi,
    type entryPoint06Address,
    entryPoint07Abi,
    entryPoint07Address,
    getUserOperationHash,
    toSmartAccount
} from "viem/account-abstraction"
import { getChainId, signMessage } from "viem/actions"
import { getAction } from "viem/utils"
import { getAccountNonce } from "../../actions/public/getAccountNonce"
import { getSenderAddress } from "../../actions/public/getSenderAddress"

const getAccountInitCode = async (
    owner: Address,
    index = BigInt(0)
): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")

    return encodeFunctionData({
        abi: [
            {
                inputs: [
                    {
                        internalType: "address",
                        name: "owner",
                        type: "address"
                    },
                    {
                        internalType: "uint256",
                        name: "salt",
                        type: "uint256"
                    }
                ],
                name: "createAccount",
                outputs: [
                    {
                        internalType: "contract SimpleAccount",
                        name: "ret",
                        type: "address"
                    }
                ],
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        functionName: "createAccount",
        args: [owner, index]
    })
}

const getAccountAddress = async ({
    client,
    factoryAddress,
    entryPointAddress,
    owner,
    entryPointVersion,
    index = BigInt(0)
}: {
    client: Client
    factoryAddress: Address
    owner: Address
    entryPointAddress: typeof entryPoint06Address | typeof entryPoint07Address
    entryPointVersion: "0.6" | "0.7"
    index?: bigint
}): Promise<Address> => {
    const factoryData = await getAccountInitCode(owner, index)

    if (entryPointVersion === "0.6") {
        return getSenderAddress<typeof entryPoint06Address>(client, {
            initCode: concatHex([factoryAddress, factoryData]),
            entryPointAddress: entryPointAddress as typeof entryPoint06Address
        })
    }

    // Get the sender address based on the init code
    return getSenderAddress<typeof entryPoint07Address>(client, {
        factory: factoryAddress,
        factoryData,
        entryPointAddress: entryPointAddress as typeof entryPoint07Address
    })
}

export type ToSimpleSmartAccountParameters<
    entryPointVersion extends "0.6" | "0.7",
    entryPointAbi extends typeof entryPoint06Abi | typeof entryPoint07Abi
> = {
    client: Client
    owner: LocalAccount
    factoryAddress?: Address
    entryPoint?: {
        address: typeof entryPoint06Address | typeof entryPoint07Address
        abi: entryPointAbi
        version: entryPointVersion
    }
    index?: bigint
    address?: Address
    nonceKey?: bigint
}

const getFactoryAddress = (
    entryPointVersion: "0.6" | "0.7",
    factoryAddress?: Address
): Address => {
    if (factoryAddress) return factoryAddress

    if (entryPointVersion === "0.6") {
        return "0x9406Cc6185a346906296840746125a0E44976454"
    }
    return "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985"
}

export type SimpleSmartAccountImplementation<
    entryPointVersion extends "0.6" | "0.7" = "0.7",
    entryPointAbi extends
        | typeof entryPoint06Abi
        | typeof entryPoint07Abi = typeof entryPoint07Abi
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

export type ToSimpleSmartAccountReturnType<
    entryPointVersion extends "0.6" | "0.7" = "0.7",
    entryPointAbi extends
        | typeof entryPoint06Abi
        | typeof entryPoint07Abi = typeof entryPoint07Abi
> = SmartAccount<
    SimpleSmartAccountImplementation<entryPointVersion, entryPointAbi>
>

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function toSimpleSmartAccount<
    entryPointVersion extends "0.6" | "0.7",
    entryPointAbi extends typeof entryPoint06Abi | typeof entryPoint07Abi
>(
    parameters: ToSimpleSmartAccountParameters<entryPointVersion, entryPointAbi>
): Promise<ToSimpleSmartAccountReturnType<entryPointVersion, entryPointAbi>> {
    const {
        client,
        owner,
        factoryAddress: _factoryAddress,
        index = BigInt(0),
        address,
        nonceKey
    } = parameters

    const entryPoint = {
        address: parameters.entryPoint?.address ?? entryPoint07Address,
        abi:
            parameters.entryPoint?.abi ??
            (parameters.entryPoint?.version ?? "0.7") === "0.6"
                ? entryPoint06Abi
                : entryPoint07Abi,
        version: parameters.entryPoint?.version ?? "0.7"
    } as const

    const factoryAddress = getFactoryAddress(
        entryPoint.version,
        _factoryAddress
    )

    let accountAddress: Address

    const getAddress = async () => {
        if (accountAddress) return accountAddress
        accountAddress =
            address ??
            (await getAccountAddress({
                client,
                factoryAddress,
                entryPointAddress: entryPoint.address,
                entryPointVersion: entryPoint.version,
                owner: owner.address,
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
            if (calls.length > 1) {
                if (entryPoint.version === "0.6") {
                    return encodeFunctionData({
                        abi: [
                            {
                                inputs: [
                                    {
                                        internalType: "address[]",
                                        name: "dest",
                                        type: "address[]"
                                    },
                                    {
                                        internalType: "bytes[]",
                                        name: "func",
                                        type: "bytes[]"
                                    }
                                ],
                                name: "executeBatch",
                                outputs: [],
                                stateMutability: "nonpayable",
                                type: "function"
                            }
                        ],
                        functionName: "executeBatch",
                        args: [
                            calls.map((a) => a.to),
                            calls.map((a) => a.data ?? "0x")
                        ]
                    })
                }
                return encodeFunctionData({
                    abi: [
                        {
                            inputs: [
                                {
                                    internalType: "address[]",
                                    name: "dest",
                                    type: "address[]"
                                },
                                {
                                    internalType: "uint256[]",
                                    name: "value",
                                    type: "uint256[]"
                                },
                                {
                                    internalType: "bytes[]",
                                    name: "func",
                                    type: "bytes[]"
                                }
                            ],
                            name: "executeBatch",
                            outputs: [],
                            stateMutability: "nonpayable",
                            type: "function"
                        }
                    ],
                    functionName: "executeBatch",
                    args: [
                        calls.map((a) => a.to),
                        calls.map((a) => a.value ?? 0n),
                        calls.map((a) => a.data ?? "0x")
                    ]
                })
            }

            return encodeFunctionData({
                abi: [
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "dest",
                                type: "address"
                            },
                            {
                                internalType: "uint256",
                                name: "value",
                                type: "uint256"
                            },
                            {
                                internalType: "bytes",
                                name: "func",
                                type: "bytes"
                            }
                        ],
                        name: "execute",
                        outputs: [],
                        stateMutability: "nonpayable",
                        type: "function"
                    }
                ],
                functionName: "execute",
                args: [calls[0].to, calls[0].value ?? 0n, calls[0].data ?? "0x"]
            })
        },
        async getFactoryArgs() {
            return {
                factory: factoryAddress,
                factoryData: await getAccountInitCode(owner.address, index)
            }
        },
        async getNonce(args) {
            return getAccountNonce(client, {
                address: accountAddress,
                entryPointAddress: entryPoint.address,
                key: args?.key ?? nonceKey
            })
        },
        async getStubSignature() {
            return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        signMessage: async (_) => {
            throw new Error("Simple account isn't 1271 compliant")
        },
        signTypedData: async (_) => {
            throw new Error("Simple account isn't 1271 compliant")
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
        ToSimpleSmartAccountReturnType<entryPointVersion, entryPointAbi>
    >
}
