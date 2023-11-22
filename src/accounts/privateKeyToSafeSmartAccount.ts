import {
    type Address,
    BaseError,
    type Chain,
    type Client,
    type Hex,
    type SignableMessage,
    type Transport,
    type TypedData,
    type TypedDataDefinition,
    concatHex,
    encodeFunctionData,
    encodePacked,
    getContractAddress,
    hashMessage,
    hashTypedData,
    hexToBigInt,
    keccak256,
    toBytes,
    zeroAddress
} from "viem"
import { privateKeyToAccount, toAccount } from "viem/accounts"
import { getBytecode, getChainId, readContract } from "viem/actions"
import { getAccountNonce } from "../actions/public/getAccountNonce.js"
import { type SmartAccount } from "./types.js"

export type SafeVersion = "1.4.1"

export const EIP712_SAFE_OPERATION_TYPE = {
    SafeOp: [
        { type: "address", name: "safe" },
        { type: "bytes", name: "callData" },
        { type: "uint256", name: "nonce" },
        { type: "uint256", name: "preVerificationGas" },
        { type: "uint256", name: "verificationGasLimit" },
        { type: "uint256", name: "callGasLimit" },
        { type: "uint256", name: "maxFeePerGas" },
        { type: "uint256", name: "maxPriorityFeePerGas" },
        { type: "address", name: "entryPoint" }
    ]
}

const SAFE_VERSION_TO_ADDRESSES_MAP: {
    [key in SafeVersion]: {
        ADD_MODULES_LIB_ADDRESS: Address
        SAFE_4337_MODULE_ADDRESS: Address
        SAFE_PROXY_FACTORY_ADDRESS: Address
        SAFE_SINGLETON_ADDRESS: Address
        MULTI_SEND_CALL_ONLY_ADDRESS: Address
    }
} = {
    "1.4.1": {
        ADD_MODULES_LIB_ADDRESS: "0x191EFDC03615B575922289DC339F4c70aC5C30Af",
        SAFE_4337_MODULE_ADDRESS: "0x39E54Bb2b3Aa444b4B39DEe15De3b7809c36Fc38",
        SAFE_PROXY_FACTORY_ADDRESS:
            "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
        SAFE_SINGLETON_ADDRESS: "0x41675C099F32341bf84BFc5382aF534df5C7461a",
        MULTI_SEND_CALL_ONLY_ADDRESS:
            "0x9641d764fc13c8B624c04430C7356C1C7C8102e2"
    }
}

export class SignTransactionNotSupportedBySafeSmartAccount extends BaseError {
    override name = "SignTransactionNotSupportedBySafeSmartAccount"
    constructor({ docsPath }: { docsPath?: string } = {}) {
        super(
            [
                "A smart account cannot sign or send transaction, it can only sign message or userOperation.",
                "Please send user operation instead."
            ].join("\n"),
            {
                docsPath,
                docsSlug: "account"
            }
        )
    }
}

const adjustVInSignature = (
    signingMethod: "eth_sign" | "eth_signTypedData",
    signature: string
): Hex => {
    const ETHEREUM_V_VALUES = [0, 1, 27, 28]
    const MIN_VALID_V_VALUE_FOR_SAFE_ECDSA = 27
    let signatureV = parseInt(signature.slice(-2), 16)
    if (!ETHEREUM_V_VALUES.includes(signatureV)) {
        throw new Error("Invalid signature")
    }
    if (signingMethod === "eth_sign") {
        if (signatureV < MIN_VALID_V_VALUE_FOR_SAFE_ECDSA) {
            signatureV += MIN_VALID_V_VALUE_FOR_SAFE_ECDSA
        }
        signatureV += 4
    }
    if (signingMethod === "eth_signTypedData") {
        if (signatureV < MIN_VALID_V_VALUE_FOR_SAFE_ECDSA) {
            signatureV += MIN_VALID_V_VALUE_FOR_SAFE_ECDSA
        }
    }
    return (signature.slice(0, -2) + signatureV.toString(16)) as Hex
}

const generateSafeMessageMessage = <
    const TTypedData extends TypedData | { [key: string]: unknown },
    TPrimaryType extends string = string
>(
    message: SignableMessage | TypedDataDefinition<TTypedData, TPrimaryType>
): Hex => {
    const signableMessage = message as SignableMessage

    if (typeof signableMessage === "string" || signableMessage.raw) {
        return hashMessage(signableMessage)
    }

    return hashTypedData(
        message as TypedDataDefinition<TTypedData, TPrimaryType>
    )
}

export type PrivateKeySafeSmartAccount<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<"privateKeySafeSmartAccount", transport, chain>

const getInitializerCode = async ({
    owner,
    addModuleLibAddress,
    safe4337ModuleAddress
}: {
    owner: Address
    addModuleLibAddress: Address
    safe4337ModuleAddress: Address
}) => {
    return encodeFunctionData({
        abi: [
            {
                inputs: [
                    {
                        internalType: "address[]",
                        name: "_owners",
                        type: "address[]"
                    },
                    {
                        internalType: "uint256",
                        name: "_threshold",
                        type: "uint256"
                    },
                    {
                        internalType: "address",
                        name: "to",
                        type: "address"
                    },
                    {
                        internalType: "bytes",
                        name: "data",
                        type: "bytes"
                    },
                    {
                        internalType: "address",
                        name: "fallbackHandler",
                        type: "address"
                    },
                    {
                        internalType: "address",
                        name: "paymentToken",
                        type: "address"
                    },
                    {
                        internalType: "uint256",
                        name: "payment",
                        type: "uint256"
                    },
                    {
                        internalType: "address payable",
                        name: "paymentReceiver",
                        type: "address"
                    }
                ],
                name: "setup",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        functionName: "setup",
        args: [
            [owner],
            1n,
            addModuleLibAddress,
            encodeFunctionData({
                abi: [
                    {
                        inputs: [
                            {
                                internalType: "address[]",
                                name: "modules",
                                type: "address[]"
                            }
                        ],
                        name: "enableModules",
                        outputs: [],
                        stateMutability: "nonpayable",
                        type: "function"
                    }
                ],
                functionName: "enableModules",
                args: [[safe4337ModuleAddress]]
            }),
            safe4337ModuleAddress,
            zeroAddress,
            0n,
            zeroAddress
        ]
    })
}

const getAccountInitCode = async ({
    owner,
    addModuleLibAddress,
    safe4337ModuleAddress,
    safeProxyFactoryAddress,
    safeSingletonAddress,
    saltNonce = 0n
}: {
    owner: Address
    addModuleLibAddress: Address
    safe4337ModuleAddress: Address
    safeProxyFactoryAddress: Address
    safeSingletonAddress: Address
    saltNonce?: bigint
}): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")
    const initializer = await getInitializerCode({
        owner,
        addModuleLibAddress,
        safe4337ModuleAddress
    })

    const initCodeCallData = encodeFunctionData({
        abi: [
            {
                inputs: [
                    {
                        internalType: "address",
                        name: "_singleton",
                        type: "address"
                    },
                    {
                        internalType: "bytes",
                        name: "initializer",
                        type: "bytes"
                    },
                    {
                        internalType: "uint256",
                        name: "saltNonce",
                        type: "uint256"
                    }
                ],
                name: "createProxyWithNonce",
                outputs: [
                    {
                        internalType: "contract SafeProxy",
                        name: "proxy",
                        type: "address"
                    }
                ],
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        functionName: "createProxyWithNonce",
        args: [safeSingletonAddress, initializer, saltNonce]
    })

    return concatHex([safeProxyFactoryAddress, initCodeCallData])
}

const getAccountAddress = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>({
    client,
    owner,
    addModuleLibAddress,
    safe4337ModuleAddress,
    safeProxyFactoryAddress,
    safeSingletonAddress,
    saltNonce = 0n
}: {
    client: Client<TTransport, TChain>
    owner: Address
    addModuleLibAddress: Address
    safe4337ModuleAddress: Address
    safeProxyFactoryAddress: Address
    safeSingletonAddress: Address
    saltNonce?: bigint
}): Promise<Address> => {
    const proxyCreationCode = await readContract(client, {
        abi: [
            {
                inputs: [],
                name: "proxyCreationCode",
                outputs: [
                    {
                        internalType: "bytes",
                        name: "",
                        type: "bytes"
                    }
                ],
                stateMutability: "pure",
                type: "function"
            }
        ],
        address: safeProxyFactoryAddress,
        functionName: "proxyCreationCode"
    })

    const deploymentCode = encodePacked(
        ["bytes", "uint256"],
        [proxyCreationCode, hexToBigInt(safeSingletonAddress)]
    )

    const initializer = await getInitializerCode({
        owner,
        addModuleLibAddress,
        safe4337ModuleAddress
    })

    const salt = keccak256(
        encodePacked(
            ["bytes32", "uint256"],
            [keccak256(encodePacked(["bytes"], [initializer])), saltNonce]
        )
    )

    return getContractAddress({
        from: safeProxyFactoryAddress,
        salt,
        bytecode: deploymentCode,
        opcode: "CREATE2"
    })
}

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function privateKeyToSafeSmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain>,
    {
        privateKey,
        safeVersion,
        entryPoint,
        addModuleLibAddress: _addModuleLibAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress,
        saltNonce = 0n
    }: {
        safeVersion: SafeVersion
        privateKey: Hex
        entryPoint: Address
        addModuleLibAddress?: Address
        safe4337ModuleAddress?: Address
        safeProxyFactoryAddress?: Address
        safeSingletonAddress?: Address
        multiSendCallOnlyAddress?: Address
        saltNonce?: bigint
    }
): Promise<PrivateKeySafeSmartAccount<TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)

    const chainId = await getChainId(client)

    const addModuleLibAddress =
        _addModuleLibAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion].ADD_MODULES_LIB_ADDRESS
    const safe4337ModuleAddress =
        _safe4337ModuleAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion].SAFE_4337_MODULE_ADDRESS
    const safeProxyFactoryAddress =
        _safeProxyFactoryAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion].SAFE_PROXY_FACTORY_ADDRESS
    const safeSingletonAddress =
        _safeSingletonAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion].SAFE_SINGLETON_ADDRESS
    const multiSendCallOnlyAddress =
        _multiSendCallOnlyAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion].MULTI_SEND_CALL_ONLY_ADDRESS

    const accountAddress = await getAccountAddress<TTransport, TChain>({
        client,
        owner: privateKeyAccount.address,
        addModuleLibAddress,
        safe4337ModuleAddress,
        safeProxyFactoryAddress,
        safeSingletonAddress,
        saltNonce
    })

    if (!accountAddress) throw new Error("Account address not found")

    const account = toAccount({
        address: accountAddress,
        async signMessage({ message }) {
            const messageHash = hashTypedData({
                domain: {
                    chainId: chainId,
                    verifyingContract: accountAddress
                },
                types: {
                    SafeMessage: [{ name: "message", type: "bytes" }]
                },
                primaryType: "SafeMessage",
                message: {
                    message: generateSafeMessageMessage(message)
                }
            })

            return adjustVInSignature(
                "eth_sign",
                await privateKeyAccount.signMessage({
                    message: {
                        raw: toBytes(messageHash)
                    }
                })
            )
        },
        async signTransaction(_, __) {
            throw new SignTransactionNotSupportedBySafeSmartAccount()
        },
        async signTypedData(typedData) {
            return adjustVInSignature(
                "eth_signTypedData",
                await privateKeyAccount.signTypedData({
                    domain: {
                        chainId: chainId,
                        verifyingContract: accountAddress
                    },
                    types: {
                        SafeMessage: [{ name: "message", type: "bytes" }]
                    },
                    primaryType: "SafeMessage",
                    message: {
                        message: generateSafeMessageMessage(typedData)
                    }
                })
            )
        }
    })

    return {
        ...account,
        client: client,
        publicKey: accountAddress,
        entryPoint: entryPoint,
        source: "privateKeySafeSmartAccount",
        async getNonce() {
            return getAccountNonce(client, {
                sender: accountAddress,
                entryPoint: entryPoint
            })
        },
        async signUserOperation(userOperation) {
            // const timestamps = 0n

            const signatures = [
                {
                    signer: privateKeyAccount.address,
                    data: await privateKeyAccount.signTypedData({
                        domain: {
                            chainId: chainId,
                            verifyingContract: safe4337ModuleAddress
                        },
                        types: EIP712_SAFE_OPERATION_TYPE,
                        primaryType: "SafeOp",
                        message: {
                            safe: accountAddress,
                            callData: userOperation.callData,
                            nonce: userOperation.nonce,
                            preVerificationGas:
                                userOperation.preVerificationGas,
                            verificationGasLimit:
                                userOperation.verificationGasLimit,
                            callGasLimit: userOperation.callGasLimit,
                            maxFeePerGas: userOperation.maxFeePerGas,
                            maxPriorityFeePerGas:
                                userOperation.maxPriorityFeePerGas,
                            // signatureTimestamps: timestamps,
                            entryPoint: entryPoint
                        }
                    })
                }
            ]

            signatures.sort((left, right) =>
                left.signer
                    .toLowerCase()
                    .localeCompare(right.signer.toLowerCase())
            )

            let signatureBytes: Address = "0x"
            for (const sig of signatures) {
                signatureBytes += sig.data.slice(2)
            }

            // const signatureWithTimestamps = encodePacked(
            //     ["uint96", "bytes"],
            //     [timestamps, signatureBytes]
            // )

            return signatureBytes
        },
        async getInitCode() {
            const contractCode = await getBytecode(client, {
                address: accountAddress
            })

            if ((contractCode?.length ?? 0) > 2) return "0x"

            return getAccountInitCode({
                owner: privateKeyAccount.address,
                addModuleLibAddress,
                safe4337ModuleAddress,
                safeProxyFactoryAddress,
                safeSingletonAddress,
                saltNonce
            })
        },
        async encodeDeployCallData(_) {
            throw new Error("Safe account doesn't support account deployment")
        },
        async encodeCallData(args) {
            let to: Address
            let value: bigint
            let data: Hex

            if (Array.isArray(args)) {
                const argsArray = args as {
                    to: Address
                    value: bigint
                    data: Hex
                }[]

                to = multiSendCallOnlyAddress
                value = 0n
                data = encodeFunctionData({
                    abi: [
                        {
                            inputs: [
                                {
                                    internalType: "bytes",
                                    name: "transactions",
                                    type: "bytes"
                                }
                            ],
                            name: "multiSend",
                            outputs: [],
                            stateMutability: "payable",
                            type: "function"
                        }
                    ],
                    functionName: "multiSend",
                    args: [
                        `0x${argsArray
                            .map(({ to, value, data }) => {
                                const datBytes = toBytes(data)
                                return encodePacked(
                                    [
                                        "uint8",
                                        "address",
                                        "uint256",
                                        "uint256",
                                        "bytes"
                                    ],
                                    [
                                        0,
                                        to,
                                        value,
                                        BigInt(datBytes.length),
                                        data
                                    ]
                                ).slice(2)
                            })
                            .join("")}`
                    ]
                })
            } else {
                const singleTransaction = args as {
                    to: Address
                    value: bigint
                    data: Hex
                }
                to = singleTransaction.to
                data = singleTransaction.data
                value = singleTransaction.value
            }

            return encodeFunctionData({
                abi: [
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "to",
                                type: "address"
                            },
                            {
                                internalType: "uint256",
                                name: "value",
                                type: "uint256"
                            },
                            {
                                internalType: "bytes",
                                name: "data",
                                type: "bytes"
                            },
                            {
                                internalType: "uint8",
                                name: "operation",
                                type: "uint8"
                            }
                        ],
                        name: "executeUserOp",
                        outputs: [],
                        stateMutability: "nonpayable",
                        type: "function"
                    }
                ],
                functionName: "executeUserOp",
                args: [to, value, data, 0]
            })
        },
        async getDummySignature() {
            return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
        }
    }
}
