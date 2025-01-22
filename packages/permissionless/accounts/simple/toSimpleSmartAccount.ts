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
    decodeFunctionData,
    encodeFunctionData
} from "viem"
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
import { getChainId, signMessage } from "viem/actions"
import { getAction } from "viem/utils"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"
import { getSenderAddress } from "../../actions/public/getSenderAddress.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"

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

export type ToSimpleSmartAccountParameters<
    entryPointVersion extends "0.6" | "0.7"
> = {
    client: Client
    owner: OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >
    factoryAddress?: Address
    entryPoint?: {
        address: Address
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
    entryPointVersion extends "0.6" | "0.7" = "0.7"
> = Assign<
    SmartAccountImplementation<
        entryPointVersion extends "0.6"
            ? typeof entryPoint06Abi
            : typeof entryPoint07Abi,
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
    entryPointVersion extends "0.6" | "0.7" = "0.7"
> = SmartAccount<SimpleSmartAccountImplementation<entryPointVersion>>

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function toSimpleSmartAccount<
    entryPointVersion extends "0.6" | "0.7"
>(
    parameters: ToSimpleSmartAccountParameters<entryPointVersion>
): Promise<ToSimpleSmartAccountReturnType<entryPointVersion>> {
    const {
        client,
        owner,
        factoryAddress: _factoryAddress,
        index = BigInt(0),
        address,
        nonceKey
    } = parameters

    const localOwner = await toOwner({ owner })

    const entryPoint = {
        address: parameters.entryPoint?.address ?? entryPoint07Address,
        abi:
            (parameters.entryPoint?.version ?? "0.7") === "0.6"
                ? entryPoint06Abi
                : entryPoint07Abi,
        version: parameters.entryPoint?.version ?? "0.7"
    } as const

    const factoryAddress = getFactoryAddress(
        entryPoint.version,
        _factoryAddress
    )

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
            factoryData: await getAccountInitCode(localOwner.address, index)
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

            const call = calls.length === 0 ? undefined : calls[0]

            if (!call) {
                throw new Error("No calls to encode")
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
                args: [call.to, call.value ?? 0n, call.data ?? "0x"]
            })
        },
        decodeCalls: async (callData) => {
            try {
                const decodedV6 = decodeFunctionData({
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
                    data: callData
                })

                const calls: {
                    to: Address
                    data: Hex
                    value?: bigint
                }[] = []

                for (let i = 0; i < decodedV6.args.length; i++) {
                    calls.push({
                        to: decodedV6.args[0][i],
                        data: decodedV6.args[1][i],
                        value: 0n
                    })
                }

                return calls
            } catch (_) {
                try {
                    const decodedV7 = decodeFunctionData({
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
                        data: callData
                    })

                    const calls: {
                        to: Address
                        data: Hex
                        value?: bigint
                    }[] = []

                    for (let i = 0; i < decodedV7.args[0].length; i++) {
                        calls.push({
                            to: decodedV7.args[0][i],
                            value: decodedV7.args[1][i],
                            data: decodedV7.args[2][i]
                        })
                    }

                    return calls
                } catch (_) {
                    const decodedSingle = decodeFunctionData({
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
                        data: callData
                    })
                    return [
                        {
                            to: decodedSingle.args[0],
                            value: decodedSingle.args[1],
                            data: decodedSingle.args[2]
                        }
                    ]
                }
            }
        },
        async getNonce(args) {
            return getAccountNonce(client, {
                address: await this.getAddress(),
                entryPointAddress: entryPoint.address,
                key: nonceKey ?? args?.key
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
                account: localOwner,
                message: {
                    raw: getUserOperationHash({
                        userOperation: {
                            ...userOperation,
                            sender:
                                userOperation.sender ??
                                (await this.getAddress()),
                            signature: "0x"
                        } as UserOperation<entryPointVersion>,
                        entryPointAddress: entryPoint.address,
                        entryPointVersion: entryPoint.version,
                        chainId: chainId
                    })
                }
            })
        }
    }) as Promise<ToSimpleSmartAccountReturnType<entryPointVersion>>
}
