import {
    type Account,
    type Address,
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
import { toAccount } from "viem/accounts"
import {
    getBytecode,
    getChainId,
    readContract,
    signMessage,
    signTypedData
} from "viem/actions"
import { getAccountNonce } from "../actions/public/getAccountNonce.js"
import {
    SignTransactionNotSupportedBySmartAccount,
    type Signer,
    type SmartAccount
} from "./types.js"

export type SafeVersion = "1.4.1"

const EIP712_SAFE_OPERATION_TYPE = {
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
        MULTI_SEND_ADDRESS: Address
        MULTI_SEND_CALL_ONLY_ADDRESS: Address
    }
} = {
    "1.4.1": {
        ADD_MODULES_LIB_ADDRESS: "0x191EFDC03615B575922289DC339F4c70aC5C30Af",
        SAFE_4337_MODULE_ADDRESS: "0x39E54Bb2b3Aa444b4B39DEe15De3b7809c36Fc38",
        SAFE_PROXY_FACTORY_ADDRESS:
            "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
        SAFE_SINGLETON_ADDRESS: "0x41675C099F32341bf84BFc5382aF534df5C7461a",
        MULTI_SEND_ADDRESS: "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526",
        MULTI_SEND_CALL_ONLY_ADDRESS:
            "0x9641d764fc13c8B624c04430C7356C1C7C8102e2"
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

const encodeInternalTransaction = (tx: {
    to: Address
    data: Address
    value: bigint
    operation: 0 | 1
}): string => {
    const encoded = encodePacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [
            tx.operation,
            tx.to,
            tx.value,
            BigInt(tx.data.slice(2).length / 2),
            tx.data
        ]
    )
    return encoded.slice(2)
}

const encodeMultiSend = (
    txs: {
        to: Address
        data: Address
        value: bigint
        operation: 0 | 1
    }[]
): `0x${string}` => {
    const data: `0x${string}` = `0x${txs
        .map((tx) => encodeInternalTransaction(tx))
        .join("")}`

    return encodeFunctionData({
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
        args: [data]
    })
}

export type SafeSmartAccount<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<"SafeSmartAccount", transport, chain>

const getInitializerCode = async ({
    owner,
    addModuleLibAddress,
    safe4337ModuleAddress,
    multiSendAddress,
    setupTransactions = [],
    safeModules = []
}: {
    owner: Address
    addModuleLibAddress: Address
    safe4337ModuleAddress: Address
    multiSendAddress: Address
    setupTransactions?: {
        to: Address
        data: Address
        value: bigint
    }[]
    safeModules?: Address[]
}) => {
    const multiSendCallData = encodeMultiSend([
        {
            to: addModuleLibAddress,
            data: encodeFunctionData({
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
                args: [[safe4337ModuleAddress, ...safeModules]]
            }),
            value: 0n,
            operation: 1
        },
        ...setupTransactions.map((tx) => ({ ...tx, operation: 0 as 0 | 1 }))
    ])

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
            multiSendAddress,
            multiSendCallData,
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
    multiSendAddress,
    saltNonce = 0n,
    setupTransactions = [],
    safeModules = []
}: {
    owner: Address
    addModuleLibAddress: Address
    safe4337ModuleAddress: Address
    safeProxyFactoryAddress: Address
    safeSingletonAddress: Address
    multiSendAddress: Address
    saltNonce?: bigint
    setupTransactions?: {
        to: Address
        data: Address
        value: bigint
    }[]
    safeModules?: Address[]
}): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")
    const initializer = await getInitializerCode({
        owner,
        addModuleLibAddress,
        safe4337ModuleAddress,
        multiSendAddress,
        setupTransactions,
        safeModules
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
    multiSendAddress,
    setupTransactions = [],
    safeModules = [],
    saltNonce = 0n
}: {
    client: Client<TTransport, TChain>
    owner: Address
    addModuleLibAddress: Address
    safe4337ModuleAddress: Address
    safeProxyFactoryAddress: Address
    safeSingletonAddress: Address
    multiSendAddress: Address
    setupTransactions: {
        to: Address
        data: Address
        value: bigint
    }[]
    safeModules?: Address[]
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
        safe4337ModuleAddress,
        multiSendAddress,
        setupTransactions,
        safeModules
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

const getDefaultAddresses = (
    safeVersion: SafeVersion,
    {
        addModuleLibAddress: _addModuleLibAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress
    }: {
        addModuleLibAddress?: Address
        safe4337ModuleAddress?: Address
        safeProxyFactoryAddress?: Address
        safeSingletonAddress?: Address
        multiSendAddress?: Address
        multiSendCallOnlyAddress?: Address
    }
) => {
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
    const multiSendAddress =
        _multiSendAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion].MULTI_SEND_ADDRESS

    const multiSendCallOnlyAddress =
        _multiSendCallOnlyAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion].MULTI_SEND_CALL_ONLY_ADDRESS

    return {
        addModuleLibAddress,
        safe4337ModuleAddress,
        safeProxyFactoryAddress,
        safeSingletonAddress,
        multiSendAddress,
        multiSendCallOnlyAddress
    }
}

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function signerToSafeSmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain>,
    {
        signer,
        safeVersion,
        entryPoint,
        addModuleLibAddress: _addModuleLibAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress,
        saltNonce = 0n,
        safeModules = [],
        setupTransactions = []
    }: {
        safeVersion: SafeVersion
        signer: Signer
        entryPoint: Address
        addModuleLibAddress?: Address
        safe4337ModuleAddress?: Address
        safeProxyFactoryAddress?: Address
        safeSingletonAddress?: Address
        multiSendAddress?: Address
        multiSendCallOnlyAddress?: Address
        saltNonce?: bigint
        setupTransactions?: {
            to: Address
            data: Address
            value: bigint
        }[]
        safeModules?: Address[]
    }
): Promise<SafeSmartAccount<TTransport, TChain>> {
    const chainId = await getChainId(client)

    const viemSigner: Account =
        signer.type === "local"
            ? ({
                  ...signer,
                  signTransaction: (_, __) => {
                      throw new SignTransactionNotSupportedBySmartAccount()
                  }
              } as Account)
            : (signer as Account)

    const {
        addModuleLibAddress,
        safe4337ModuleAddress,
        safeProxyFactoryAddress,
        safeSingletonAddress,
        multiSendAddress,
        multiSendCallOnlyAddress
    } = getDefaultAddresses(safeVersion, {
        addModuleLibAddress: _addModuleLibAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress
    })

    const accountAddress = await getAccountAddress<TTransport, TChain>({
        client,
        owner: viemSigner.address,
        addModuleLibAddress,
        safe4337ModuleAddress,
        safeProxyFactoryAddress,
        safeSingletonAddress,
        multiSendAddress,
        saltNonce,
        setupTransactions,
        safeModules
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
                await signMessage(client, {
                    account: viemSigner,
                    message: {
                        raw: toBytes(messageHash)
                    }
                })
            )
        },
        async signTransaction(_, __) {
            throw new SignTransactionNotSupportedBySmartAccount()
        },
        async signTypedData(typedData) {
            return adjustVInSignature(
                "eth_signTypedData",
                await signTypedData(client, {
                    account: viemSigner,
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
        source: "SafeSmartAccount",
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
                    signer: viemSigner.address,
                    data: await signTypedData(client, {
                        account: viemSigner,
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
                owner: viemSigner.address,
                addModuleLibAddress,
                safe4337ModuleAddress,
                safeProxyFactoryAddress,
                safeSingletonAddress,
                multiSendAddress,
                saltNonce,
                setupTransactions,
                safeModules
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

                data = encodeMultiSend(
                    argsArray.map((tx) => ({ ...tx, operation: 0 }))
                )
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
