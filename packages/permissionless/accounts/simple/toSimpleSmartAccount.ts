import {
    type Account,
    type Address,
    type Assign,
    type Chain,
    type Client,
    type Hex,
    type JsonRpcAccount,
    type LocalAccount,
    type OneOf,
    type PrivateKeyAccount,
    type Transport,
    type WalletClient,
    decodeFunctionData,
    encodeFunctionData
} from "viem"
import {
    type EntryPointVersion,
    type SmartAccount,
    type SmartAccountImplementation,
    type UserOperation,
    entryPoint06Abi,
    entryPoint07Abi,
    entryPoint07Address,
    entryPoint08Abi,
    entryPoint08Address,
    getUserOperationHash,
    getUserOperationTypedData,
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
    entryPointVersion extends EntryPointVersion,
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >,
    eip7702 extends boolean = false
> = {
    client: Client<
        Transport,
        Chain | undefined,
        JsonRpcAccount | LocalAccount | undefined
    >
    owner: owner
    eip7702?: eip7702
} & (eip7702 extends true
    ? {
          entryPoint?: {
              address: Address
              version: "0.8"
          }
          factoryAddress?: never
          index?: never
          address?: never
          nonceKey?: never
          accountLogicAddress?: Address
      }
    : {
          entryPoint?: {
              address: Address
              version: entryPointVersion
          }
          factoryAddress?: Address
          index?: bigint
          address?: Address
          nonceKey?: bigint
          accountLogicAddress?: Address
      })

const getFactoryAddress = (
    entryPointVersion: EntryPointVersion,
    factoryAddress?: Address
): Address => {
    if (factoryAddress) return factoryAddress

    switch (entryPointVersion) {
        case "0.8":
            return "0x13E9ed32155810FDbd067D4522C492D6f68E5944"
        case "0.7":
            return "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985"
        default:
            return "0x9406Cc6185a346906296840746125a0E44976454"
    }
}

const getEntryPointAbi = (entryPointVersion: EntryPointVersion) => {
    switch (entryPointVersion) {
        case "0.8":
            return entryPoint08Abi
        case "0.7":
            return entryPoint07Abi
        default:
            return entryPoint06Abi
    }
}

export type SimpleSmartAccountImplementation<
    entryPointVersion extends EntryPointVersion = "0.7",
    eip7702 extends boolean = false
> = Assign<
    SmartAccountImplementation<
        ReturnType<typeof getEntryPointAbi>,
        entryPointVersion,
        eip7702 extends true ? object : object,
        eip7702
    >,
    { sign: NonNullable<SmartAccountImplementation["sign"]> }
>

export type ToSimpleSmartAccountReturnType<
    entryPointVersion extends EntryPointVersion = "0.7",
    eip7702 extends boolean = false
> = eip7702 extends true
    ? SmartAccount<SimpleSmartAccountImplementation<entryPointVersion, true>>
    : SmartAccount<SimpleSmartAccountImplementation<entryPointVersion, false>>

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function toSimpleSmartAccount<
    entryPointVersion extends EntryPointVersion,
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >,
    eip7702 extends boolean = false
>(
    parameters: ToSimpleSmartAccountParameters<
        entryPointVersion,
        owner,
        eip7702
    >
): Promise<ToSimpleSmartAccountReturnType<entryPointVersion, eip7702>> {
    const {
        client,
        owner,
        factoryAddress: _factoryAddress,
        index = BigInt(0),
        eip7702 = false,
        address = eip7702 ? owner.address : undefined,
        nonceKey,
        accountLogicAddress = "0xe6Cae83BdE06E4c305530e199D7217f42808555B"
    } = parameters

    const localOwner = await toOwner({
        owner,
        address
    })

    const entryPoint = parameters.entryPoint
        ? {
              address: parameters.entryPoint.address,
              abi: getEntryPointAbi(parameters.entryPoint.version),
              version: parameters.entryPoint.version
          }
        : eip7702
          ? ({
                address: entryPoint08Address,
                abi: getEntryPointAbi("0.8"),
                version: "0.8"
            } as const)
          : ({
                address: entryPoint07Address,
                abi: getEntryPointAbi("0.7"),
                version: "0.7"
            } as const)

    const factoryAddress = getFactoryAddress(
        entryPoint.version,
        _factoryAddress
    )

    let chainId: number

    const getMemoizedChainId = async () => {
        if (chainId) return chainId
        chainId = client.chain
            ? client.chain.id
            : await getAction(client, getChainId, "getChainId")({})
        return chainId
    }

    const getFactoryArgsFunc = () => async () => {
        return {
            factory: factoryAddress,
            factoryData: await getAccountInitCode(localOwner.address, index)
        }
    }

    const { accountAddress, getFactoryArgs } = await (async () => {
        if (eip7702) {
            return {
                accountAddress: localOwner.address,
                getFactoryArgs: async () => {
                    return {
                        factory: undefined,
                        factoryData: undefined
                    }
                }
            }
        }

        const getFactoryArgs = getFactoryArgsFunc()

        if (address) {
            return { accountAddress: address, getFactoryArgs }
        }

        const { factory, factoryData } = await getFactoryArgs()

        const accountAddress = await getSenderAddress(client, {
            factory,
            factoryData,
            entryPointAddress: entryPoint.address
        })

        return { accountAddress, getFactoryArgs }
    })()

    return toSmartAccount({
        client,
        entryPoint,
        getFactoryArgs,
        extend: eip7702
            ? {
                  implementation: accountLogicAddress
              }
            : undefined,
        authorization: eip7702
            ? {
                  address: accountLogicAddress as Address,
                  account: localOwner as PrivateKeyAccount
              }
            : undefined,
        async getAddress() {
            return accountAddress
        },
        async encodeCalls(calls) {
            if (calls.length > 1) {
                if (entryPoint.version === "0.8") {
                    return encodeFunctionData({
                        abi: executeBatch08Abi,
                        functionName: "executeBatch",
                        args: [
                            calls.map((a) => ({
                                target: a.to,
                                value: a.value ?? 0n,
                                data: a.data ?? "0x"
                            }))
                        ]
                    })
                }

                if (entryPoint.version === "0.7") {
                    return encodeFunctionData({
                        abi: executeBatch07Abi,
                        functionName: "executeBatch",
                        args: [
                            calls.map((a) => a.to),
                            calls.map((a) => a.value ?? 0n),
                            calls.map((a) => a.data ?? "0x")
                        ]
                    })
                }

                return encodeFunctionData({
                    abi: executeBatch06Abi,
                    functionName: "executeBatch",
                    args: [
                        calls.map((a) => a.to),
                        calls.map((a) => a.data ?? "0x")
                    ]
                })
            }

            const call = calls.length === 0 ? undefined : calls[0]

            if (!call) {
                throw new Error("No calls to encode")
            }

            // 0.6, 0.7 and 0.8 all use the same for "execute"
            return encodeFunctionData({
                abi: executeSingleAbi,
                functionName: "execute",
                args: [call.to, call.value ?? 0n, call.data ?? "0x"]
            })
        },
        decodeCalls: async (callData) => {
            try {
                const calls: {
                    to: Address
                    data: Hex
                    value?: bigint
                }[] = []

                if (entryPoint.version === "0.8") {
                    const decodedV8 = decodeFunctionData({
                        abi: executeBatch08Abi,
                        data: callData
                    })

                    for (const call of decodedV8.args[0]) {
                        calls.push({
                            to: call.target,
                            data: call.data,
                            value: call.value
                        })
                    }

                    return calls
                }

                if (entryPoint.version === "0.7") {
                    const decodedV7 = decodeFunctionData({
                        abi: executeBatch07Abi,
                        data: callData
                    })

                    const destinations = decodedV7.args[0]
                    const values = decodedV7.args[1]
                    const datas = decodedV7.args[2]

                    for (let i = 0; i < destinations.length; i++) {
                        calls.push({
                            to: destinations[i],
                            data: datas[i],
                            value: values[i]
                        })
                    }

                    return calls
                }

                if (entryPoint.version === "0.6") {
                    const decodedV6 = decodeFunctionData({
                        abi: executeBatch06Abi,
                        data: callData
                    })

                    const destinations = decodedV6.args[0]
                    const datas = decodedV6.args[1]

                    for (let i = 0; i < destinations.length; i++) {
                        calls.push({
                            to: destinations[i],
                            data: datas[i],
                            value: 0n
                        })
                    }

                    return calls
                }

                return calls
            } catch (_) {
                const decodedSingle = decodeFunctionData({
                    abi: executeSingleAbi,
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

            // 0.8 Signs using typed data
            if (entryPoint.version === "0.8") {
                const typedData = getUserOperationTypedData({
                    chainId,
                    entryPointAddress: entryPoint.address,
                    userOperation: {
                        ...userOperation,
                        sender: await this.getAddress(),
                        signature: "0x"
                    }
                })
                return localOwner.signTypedData(typedData)
            }

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
    }) as Promise<ToSimpleSmartAccountReturnType<entryPointVersion, eip7702>>
}

const executeSingleAbi = [
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
] as const

const executeBatch06Abi = [
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
] as const

const executeBatch07Abi = [
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
] as const

const executeBatch08Abi = [
    {
        type: "function",
        name: "executeBatch",
        inputs: [
            {
                name: "calls",
                type: "tuple[]",
                internalType: "struct BaseAccount.Call[]",
                components: [
                    {
                        name: "target",
                        type: "address",
                        internalType: "address"
                    },
                    {
                        name: "value",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "data",
                        type: "bytes",
                        internalType: "bytes"
                    }
                ]
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    }
] as const
