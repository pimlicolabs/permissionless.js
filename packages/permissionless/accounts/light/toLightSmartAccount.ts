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
    concat,
    decodeFunctionData,
    encodeFunctionData,
    hashMessage,
    hashTypedData
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
                        internalType: "contract LightAccount",
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

export type LightAccountVersion<entryPointVersion extends "0.6" | "0.7"> =
    entryPointVersion extends "0.6" ? "1.1.0" : "2.0.0"

export type ToLightSmartAccountParameters<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
> = {
    client: Client
    entryPoint?: {
        address: Address
        version: entryPointVersion
    }
    owner: OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >
    version: LightAccountVersion<entryPointVersion>
    factoryAddress?: Address
    index?: bigint
    address?: Address
    nonceKey?: bigint
}

async function signWith1271WrapperV1(
    signer: LocalAccount,
    chainId: number,
    accountAddress: Address,
    hashedMessage: Hex
): Promise<Hex> {
    return signer.signTypedData({
        domain: {
            chainId: Number(chainId),
            name: "LightAccount",
            verifyingContract: accountAddress,
            version: "1"
        },
        types: {
            LightAccountMessage: [{ name: "message", type: "bytes" }]
        },
        message: {
            message: hashedMessage
        },
        primaryType: "LightAccountMessage"
    })
}

const LIGHT_VERSION_TO_ADDRESSES_MAP: {
    [key in LightAccountVersion<"0.6" | "0.7">]: {
        factoryAddress: Address
    }
} = {
    "1.1.0": {
        factoryAddress: "0x00004EC70002a32400f8ae005A26081065620D20"
    },
    "2.0.0": {
        factoryAddress: "0x0000000000400CdFef5E2714E63d8040b700BC24"
    }
}

const getDefaultAddresses = (
    lightAccountVersion: LightAccountVersion<"0.6" | "0.7">,
    {
        factoryAddress: _factoryAddress
    }: {
        factoryAddress?: Address
    }
) => {
    const factoryAddress =
        _factoryAddress ??
        LIGHT_VERSION_TO_ADDRESSES_MAP[lightAccountVersion].factoryAddress

    return {
        factoryAddress
    }
}

export type LightSmartAccountImplementation<
    entryPointVersion extends "0.6" | "0.7"
> = Assign<
    SmartAccountImplementation<
        entryPointVersion extends "0.6"
            ? typeof entryPoint06Abi
            : typeof entryPoint07Abi,
        entryPointVersion
    >,
    { sign: NonNullable<SmartAccountImplementation["sign"]> }
>

export type ToLightSmartAccountReturnType<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
> = SmartAccount<LightSmartAccountImplementation<entryPointVersion>>

enum SignatureType {
    EOA = "0x00"
    // CONTRACT = "0x01",
    // CONTRACT_WITH_ADDR = "0x02"
}

/**
 * @description Creates an Light Account from a private key.
 *
 * @returns A Private Key Light Account.
 */
export async function toLightSmartAccount<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
>(
    parameters: ToLightSmartAccountParameters<entryPointVersion>
): Promise<ToLightSmartAccountReturnType<entryPointVersion>> {
    const {
        version,
        factoryAddress: _factoryAddress,
        address,
        owner,
        client,
        index = BigInt(0),
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

    const { factoryAddress } = getDefaultAddresses(version, {
        factoryAddress: _factoryAddress
    })

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

            accountAddress = await getSenderAddress(client, {
                factory,
                factoryData,
                entryPointAddress: entryPoint.address
            })

            return accountAddress
        },
        async encodeCalls(calls) {
            if (calls.length > 1) {
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
        async decodeCalls(callData) {
            try {
                const decoded = decodeFunctionData({
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

                if (decoded.functionName === "executeBatch") {
                    const calls: {
                        to: Address
                        value: bigint
                        data: Hex
                    }[] = []

                    for (let i = 0; i < decoded.args[0].length; i++) {
                        calls.push({
                            to: decoded.args[0][i],
                            value: decoded.args[1][i],
                            data: decoded.args[2][i]
                        })
                    }

                    return calls
                }

                throw new Error("Invalid function name")
            } catch (_) {
                const decoded = decodeFunctionData({
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
                        to: decoded.args[0],
                        value: decoded.args[1],
                        data: decoded.args[2]
                    }
                ]
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
            const signature =
                "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"

            switch (version) {
                case "1.1.0":
                    return signature
                case "2.0.0":
                    return concat([SignatureType.EOA, signature])
                default:
                    throw new Error("Unknown Light Account version")
            }
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        async signMessage({ message }) {
            const signature = await signWith1271WrapperV1(
                localOwner,
                await getMemoizedChainId(),
                await this.getAddress(),
                hashMessage(message)
            )

            switch (version) {
                case "1.1.0":
                    return signature
                case "2.0.0":
                    return concat([SignatureType.EOA, signature])
                default:
                    throw new Error("Unknown Light Account version")
            }
        },
        async signTypedData(typedData) {
            const signature = await signWith1271WrapperV1(
                localOwner,
                await getMemoizedChainId(),
                await this.getAddress(),
                hashTypedData(typedData)
            )

            switch (version) {
                case "1.1.0":
                    return signature
                case "2.0.0":
                    return concat([SignatureType.EOA, signature])
                default:
                    throw new Error("Unknown Light Account version")
            }
        },
        async signUserOperation(parameters) {
            const { chainId = await getMemoizedChainId(), ...userOperation } =
                parameters

            const hash = getUserOperationHash({
                userOperation: {
                    ...userOperation,
                    signature: "0x"
                } as UserOperation<entryPointVersion>,
                entryPointAddress: entryPoint.address,
                entryPointVersion: entryPoint.version,
                chainId: chainId
            })

            const signature = await signMessage(client, {
                account: localOwner,
                message: {
                    raw: hash
                }
            })

            switch (version) {
                case "1.1.0":
                    return signature
                case "2.0.0":
                    return concat([SignatureType.EOA, signature])
                default:
                    throw new Error("Unknown Light Account version")
            }
        }
    }) as Promise<ToLightSmartAccountReturnType<entryPointVersion>>
}
