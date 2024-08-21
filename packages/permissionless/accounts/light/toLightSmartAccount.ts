import {
    type Address,
    type Assign,
    type Client,
    type Hex,
    type LocalAccount,
    concatHex,
    encodeFunctionData,
    hashMessage,
    hashTypedData
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

const getAccountAddress = async <
    entryPointAddress extends
        | typeof entryPoint06Address
        | typeof entryPoint07Address,
    entryPointVersion extends "0.6" | "0.7"
>({
    client,
    factoryAddress,
    entryPointAddress,
    entryPointVersion,
    owner,
    index = BigInt(0)
}: {
    client: Client
    factoryAddress: Address
    owner: Address
    entryPointAddress: entryPointAddress
    entryPointVersion: entryPointVersion
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

export type LightAccountVersion = "1.1.0"

export type ToLightSmartAccountParameters<
    entryPointVersion extends "0.6" | "0.7",
    entryPointAbi extends typeof entryPoint06Abi | typeof entryPoint07Abi
> = {
    client: Client
    entryPoint?: {
        address: typeof entryPoint06Address | typeof entryPoint07Address
        abi: entryPointAbi
        version: entryPointVersion
    }
    owner: LocalAccount
    version: LightAccountVersion
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
    [key in LightAccountVersion]: {
        factoryAddress: Address
    }
} = {
    "1.1.0": {
        factoryAddress: "0x00004EC70002a32400f8ae005A26081065620D20"
    }
}

const getDefaultAddresses = (
    lightAccountVersion: LightAccountVersion,
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
    entryPointVersion extends "0.6" | "0.7",
    entryPointAbi extends
        | typeof entryPoint06Abi
        | typeof entryPoint07Abi = entryPointVersion extends "0.6"
        ? typeof entryPoint06Abi
        : typeof entryPoint07Abi
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

export type ToLightSmartAccountReturnType<
    entryPointVersion extends "0.6" | "0.7" = "0.7",
    entryPointAbi extends
        | typeof entryPoint06Abi
        | typeof entryPoint07Abi = typeof entryPoint07Abi
> = SmartAccount<
    LightSmartAccountImplementation<entryPointVersion, entryPointAbi>
>

/**
 * @description Creates an Light Account from a private key.
 *
 * @returns A Private Key Light Account.
 */
export async function toLightSmartAccount<
    entryPointVersion extends "0.6" | "0.7",
    entryPointAbi extends typeof entryPoint06Abi | typeof entryPoint07Abi
>(
    parameters: ToLightSmartAccountParameters<entryPointVersion, entryPointAbi>
): Promise<ToLightSmartAccountReturnType<entryPointVersion, entryPointAbi>> {
    const {
        version,
        factoryAddress: _factoryAddress,
        address,
        owner,
        client,
        index = BigInt(0),
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

    if (version !== "1.1.0") {
        throw new Error(
            "Only Light Account version 1.1.0 is supported at the moment"
        )
    }

    const { factoryAddress } = getDefaultAddresses(version, {
        factoryAddress: _factoryAddress
    })

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
                address: await getAddress(),
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
        async signMessage({ message }) {
            return signWith1271WrapperV1(
                owner,
                await getMemoizedChainId(),
                await getAddress(),
                hashMessage(message)
            )
        },
        async signTypedData(typedData) {
            return signWith1271WrapperV1(
                owner,
                await getMemoizedChainId(),
                await getAddress(),
                hashTypedData(typedData)
            )
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

            return signMessage(client, {
                account: owner,
                message: {
                    raw: hash
                }
            })
        }
    }) as Promise<
        ToLightSmartAccountReturnType<entryPointVersion, entryPointAbi>
    >
}
