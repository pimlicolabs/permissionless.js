import {
    type Account,
    type Address,
    type Assign,
    type Chain,
    type Client,
    type Hex,
    type LocalAccount,
    type OneOf,
    type SignableMessage,
    type Transport,
    type TypedData,
    type TypedDataDefinition,
    type WalletClient,
    concat,
    concatHex,
    encodeAbiParameters,
    encodeFunctionData,
    encodePacked,
    getContractAddress,
    hashMessage,
    hashTypedData,
    hexToBigInt,
    keccak256,
    pad,
    toBytes,
    toHex,
    zeroAddress
} from "viem"
import {
    type SmartAccount,
    type SmartAccountImplementation,
    type UserOperation,
    entryPoint06Abi,
    entryPoint07Abi,
    entryPoint07Address,
    toSmartAccount
} from "viem/account-abstraction"
import { getChainId, readContract, signTypedData } from "viem/actions"
import { getAction } from "viem/utils"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"
import { encode7579Calls } from "../../utils/encode7579Calls.js"
import { isSmartAccountDeployed } from "../../utils/isSmartAccountDeployed.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"

export type SafeVersion = "1.4.1"

const multiSendAbi = [
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
] as const

const initSafe7579Abi = [
    {
        type: "function",
        name: "initSafe7579",
        inputs: [
            {
                name: "safe7579",
                type: "address",
                internalType: "address"
            },
            {
                name: "executors",
                type: "tuple[]",
                internalType: "struct ModuleInit[]",
                components: [
                    {
                        name: "module",
                        type: "address",
                        internalType: "address"
                    },
                    {
                        name: "initData",
                        type: "bytes",
                        internalType: "bytes"
                    }
                ]
            },
            {
                name: "fallbacks",
                type: "tuple[]",
                internalType: "struct ModuleInit[]",
                components: [
                    {
                        name: "module",
                        type: "address",
                        internalType: "address"
                    },
                    {
                        name: "initData",
                        type: "bytes",
                        internalType: "bytes"
                    }
                ]
            },
            {
                name: "hooks",
                type: "tuple[]",
                internalType: "struct ModuleInit[]",
                components: [
                    {
                        name: "module",
                        type: "address",
                        internalType: "address"
                    },
                    {
                        name: "initData",
                        type: "bytes",
                        internalType: "bytes"
                    }
                ]
            },
            {
                name: "attesters",
                type: "address[]",
                internalType: "address[]"
            },
            {
                name: "threshold",
                type: "uint8",
                internalType: "uint8"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    }
] as const

const preValidationSetupAbi = [
    {
        type: "function",
        name: "preValidationSetup",
        inputs: [
            {
                name: "initHash",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "to",
                type: "address",
                internalType: "address"
            },
            {
                name: "preInit",
                type: "bytes",
                internalType: "bytes"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    }
] as const

const enableModulesAbi = [
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
] as const

const setupAbi = [
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
] as const

const createProxyWithNonceAbi = [
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
] as const

const setupSafeAbi = [
    {
        type: "function",
        name: "setupSafe",
        inputs: [
            {
                name: "initData",
                type: "tuple",
                internalType: "struct Safe7579Launchpad.InitData",
                components: [
                    {
                        name: "singleton",
                        type: "address",
                        internalType: "address"
                    },
                    {
                        name: "owners",
                        type: "address[]",
                        internalType: "address[]"
                    },
                    {
                        name: "threshold",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "setupTo",
                        type: "address",
                        internalType: "address"
                    },
                    {
                        name: "setupData",
                        type: "bytes",
                        internalType: "bytes"
                    },
                    {
                        name: "safe7579",
                        type: "address",
                        internalType: "contract ISafe7579"
                    },
                    {
                        name: "validators",
                        type: "tuple[]",
                        internalType: "struct ModuleInit[]",
                        components: [
                            {
                                name: "module",
                                type: "address",
                                internalType: "address"
                            },
                            {
                                name: "initData",
                                type: "bytes",
                                internalType: "bytes"
                            }
                        ]
                    },
                    {
                        name: "callData",
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

const executeUserOpWithErrorStringAbi = [
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
        name: "executeUserOpWithErrorString",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const

const EIP712_SAFE_OPERATION_TYPE_V06 = {
    SafeOp: [
        { type: "address", name: "safe" },
        { type: "uint256", name: "nonce" },
        { type: "bytes", name: "initCode" },
        { type: "bytes", name: "callData" },
        { type: "uint256", name: "callGasLimit" },
        { type: "uint256", name: "verificationGasLimit" },
        { type: "uint256", name: "preVerificationGas" },
        { type: "uint256", name: "maxFeePerGas" },
        { type: "uint256", name: "maxPriorityFeePerGas" },
        { type: "bytes", name: "paymasterAndData" },
        { type: "uint48", name: "validAfter" },
        { type: "uint48", name: "validUntil" },
        { type: "address", name: "entryPoint" }
    ]
}

const EIP712_SAFE_OPERATION_TYPE_V07 = {
    SafeOp: [
        { type: "address", name: "safe" },
        { type: "uint256", name: "nonce" },
        { type: "bytes", name: "initCode" },
        { type: "bytes", name: "callData" },
        { type: "uint128", name: "verificationGasLimit" },
        { type: "uint128", name: "callGasLimit" },
        { type: "uint256", name: "preVerificationGas" },
        { type: "uint128", name: "maxPriorityFeePerGas" },
        { type: "uint128", name: "maxFeePerGas" },
        { type: "bytes", name: "paymasterAndData" },
        { type: "uint48", name: "validAfter" },
        { type: "uint48", name: "validUntil" },
        { type: "address", name: "entryPoint" }
    ]
}

const SAFE_VERSION_TO_ADDRESSES_MAP: {
    [key in SafeVersion]: {
        [key in "0.6" | "0.7"]: {
            SAFE_MODULE_SETUP_ADDRESS: Address
            SAFE_4337_MODULE_ADDRESS: Address
            SAFE_PROXY_FACTORY_ADDRESS: Address
            SAFE_SINGLETON_ADDRESS: Address
            MULTI_SEND_ADDRESS: Address
            MULTI_SEND_CALL_ONLY_ADDRESS: Address
        }
    }
} = {
    "1.4.1": {
        "0.6": {
            SAFE_MODULE_SETUP_ADDRESS:
                "0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb",
            SAFE_4337_MODULE_ADDRESS:
                "0xa581c4A4DB7175302464fF3C06380BC3270b4037",
            SAFE_PROXY_FACTORY_ADDRESS:
                "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
            SAFE_SINGLETON_ADDRESS:
                "0x41675C099F32341bf84BFc5382aF534df5C7461a",
            MULTI_SEND_ADDRESS: "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526",
            MULTI_SEND_CALL_ONLY_ADDRESS:
                "0x9641d764fc13c8B624c04430C7356C1C7C8102e2"
        },
        "0.7": {
            SAFE_MODULE_SETUP_ADDRESS:
                "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47",
            SAFE_4337_MODULE_ADDRESS:
                "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226",
            SAFE_PROXY_FACTORY_ADDRESS:
                "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
            SAFE_SINGLETON_ADDRESS:
                "0x41675C099F32341bf84BFc5382aF534df5C7461a",
            MULTI_SEND_ADDRESS: "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526",
            MULTI_SEND_CALL_ONLY_ADDRESS:
                "0x9641d764fc13c8B624c04430C7356C1C7C8102e2"
        }
    }
}

const adjustVInSignature = (
    signingMethod: "eth_sign" | "eth_signTypedData",
    signature: string
): Hex => {
    const ETHEREUM_V_VALUES = [0, 1, 27, 28]
    const MIN_VALID_V_VALUE_FOR_SAFE_ECDSA = 27
    let signatureV = Number.parseInt(signature.slice(-2), 16)
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
    TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
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
        abi: multiSendAbi,
        functionName: "multiSend",
        args: [data]
    })
}

const get7579LaunchPadInitData = ({
    safe4337ModuleAddress,
    safeSingletonAddress,
    erc7579LaunchpadAddress,
    owner,
    validators,
    executors,
    fallbacks,
    hooks,
    attesters,
    attestersThreshold
}: {
    safe4337ModuleAddress: Address
    safeSingletonAddress: Address
    erc7579LaunchpadAddress: Address
    owner: Address
    executors: {
        address: Address
        context: Address
    }[]
    validators: { address: Address; context: Address }[]
    fallbacks: { address: Address; context: Address }[]
    hooks: { address: Address; context: Address }[]
    attesters: Address[]
    attestersThreshold: number
}) => {
    const initData = {
        singleton: safeSingletonAddress,
        owners: [owner],
        threshold: BigInt(1),
        setupTo: erc7579LaunchpadAddress,
        setupData: encodeFunctionData({
            abi: initSafe7579Abi,
            functionName: "initSafe7579",
            args: [
                safe4337ModuleAddress, // SAFE_7579_ADDRESS,
                executors.map((executor) => ({
                    module: executor.address,
                    initData: executor.context
                })),
                fallbacks.map((fallback) => ({
                    module: fallback.address,
                    initData: fallback.context
                })),
                hooks.map((hook) => ({
                    module: hook.address,
                    initData: hook.context
                })),
                attesters,
                attestersThreshold
            ]
        }),
        safe7579: safe4337ModuleAddress,
        validators: validators
    }

    return initData
}

const getInitializerCode = async ({
    owner,
    safeModuleSetupAddress,
    safe4337ModuleAddress,
    multiSendAddress,
    safeSingletonAddress,
    erc7579LaunchpadAddress,
    setupTransactions = [],
    safeModules = [],
    validators = [],
    executors = [],
    fallbacks = [],
    hooks = [],
    attesters = [],
    attestersThreshold = 0,
    paymentToken = zeroAddress,
    payment = BigInt(0),
    paymentReceiver = zeroAddress
}: {
    owner: Address
    safeSingletonAddress: Address
    safeModuleSetupAddress: Address
    safe4337ModuleAddress: Address
    multiSendAddress: Address
    erc7579LaunchpadAddress?: Address
    setupTransactions?: {
        to: Address
        data: Address
        value: bigint
    }[]
    safeModules?: Address[]
    validators?: { address: Address; context: Address }[]
    executors?: {
        address: Address
        context: Address
    }[]
    fallbacks?: { address: Address; context: Address }[]
    hooks?: { address: Address; context: Address }[]
    attesters?: Address[]
    attestersThreshold?: number
    paymentToken?: Address
    payment?: bigint
    paymentReceiver?: Address
}) => {
    if (erc7579LaunchpadAddress) {
        const initData = get7579LaunchPadInitData({
            safe4337ModuleAddress,
            safeSingletonAddress,
            erc7579LaunchpadAddress,
            owner,
            validators,
            executors,
            fallbacks,
            hooks,
            attesters,
            attestersThreshold
        })

        const initHash = keccak256(
            encodeAbiParameters(
                [
                    {
                        internalType: "address",
                        name: "singleton",
                        type: "address"
                    },
                    {
                        internalType: "address[]",
                        name: "owners",
                        type: "address[]"
                    },
                    {
                        internalType: "uint256",
                        name: "threshold",
                        type: "uint256"
                    },
                    {
                        internalType: "address",
                        name: "setupTo",
                        type: "address"
                    },
                    {
                        internalType: "bytes",
                        name: "setupData",
                        type: "bytes"
                    },
                    {
                        internalType: "contract ISafe7579",
                        name: "safe7579",
                        type: "address"
                    },
                    {
                        internalType: "struct ModuleInit[]",
                        name: "validators",
                        type: "tuple[]",
                        components: [
                            {
                                internalType: "address",
                                name: "module",
                                type: "address"
                            },
                            {
                                internalType: "bytes",
                                name: "initData",
                                type: "bytes"
                            }
                        ]
                    }
                ],
                [
                    initData.singleton,
                    initData.owners,
                    initData.threshold,
                    initData.setupTo,
                    initData.setupData,
                    initData.safe7579,
                    initData.validators.map((validator) => ({
                        module: validator.address,
                        initData: validator.context
                    }))
                ]
            )
        )

        return encodeFunctionData({
            abi: preValidationSetupAbi,
            functionName: "preValidationSetup",
            args: [initHash, zeroAddress, "0x"]
        })
    }

    const multiSendCallData = encodeMultiSend([
        {
            to: safeModuleSetupAddress,
            data: encodeFunctionData({
                abi: enableModulesAbi,
                functionName: "enableModules",
                args: [[safe4337ModuleAddress, ...safeModules]]
            }),
            value: BigInt(0),
            operation: 1
        },
        ...setupTransactions.map((tx) => ({ ...tx, operation: 0 as 0 | 1 }))
    ])

    return encodeFunctionData({
        abi: setupAbi,
        functionName: "setup",
        args: [
            [owner],
            BigInt(1),
            multiSendAddress,
            multiSendCallData,
            safe4337ModuleAddress,
            paymentToken,
            payment,
            paymentReceiver
        ]
    })
}

function getPaymasterAndData(unpackedUserOperation: UserOperation) {
    return unpackedUserOperation.paymaster
        ? concat([
              unpackedUserOperation.paymaster,
              pad(
                  toHex(
                      unpackedUserOperation.paymasterVerificationGasLimit ||
                          BigInt(0)
                  ),
                  {
                      size: 16
                  }
              ),
              pad(
                  toHex(
                      unpackedUserOperation.paymasterPostOpGasLimit || BigInt(0)
                  ),
                  {
                      size: 16
                  }
              ),
              unpackedUserOperation.paymasterData || ("0x" as Hex)
          ])
        : "0x"
}

const getAccountInitCode = async ({
    owner,
    safeModuleSetupAddress,
    safe4337ModuleAddress,
    safeSingletonAddress,
    erc7579LaunchpadAddress,
    multiSendAddress,
    paymentToken,
    payment,
    paymentReceiver,
    saltNonce = BigInt(0),
    setupTransactions = [],
    safeModules = [],
    validators = [],
    executors = [],
    fallbacks = [],
    hooks = [],
    attesters = [],
    attestersThreshold = 0
}: {
    owner: Address
    safeModuleSetupAddress: Address
    safe4337ModuleAddress: Address
    safeSingletonAddress: Address
    multiSendAddress: Address
    erc7579LaunchpadAddress?: Address
    saltNonce?: bigint
    setupTransactions?: {
        to: Address
        data: Address
        value: bigint
    }[]
    safeModules?: Address[]
    validators?: { address: Address; context: Address }[]
    executors?: {
        address: Address
        context: Address
    }[]
    fallbacks?: { address: Address; context: Address }[]
    hooks?: { address: Address; context: Address }[]
    attesters?: Address[]
    attestersThreshold?: number
    paymentToken?: Address
    payment?: bigint
    paymentReceiver?: Address
}): Promise<Hex> => {
    if (!owner) {
        throw new Error("Owner account not found")
    }

    const initializer = await getInitializerCode({
        owner,
        safeModuleSetupAddress,
        safe4337ModuleAddress,
        multiSendAddress,
        setupTransactions,
        safeSingletonAddress,
        safeModules,
        erc7579LaunchpadAddress,
        validators,
        executors,
        fallbacks,
        hooks,
        attesters,
        attestersThreshold,
        paymentToken,
        payment,
        paymentReceiver
    })

    const initCodeCallData = encodeFunctionData({
        abi: createProxyWithNonceAbi,
        functionName: "createProxyWithNonce",
        args: [
            erc7579LaunchpadAddress ?? safeSingletonAddress,
            initializer,
            saltNonce
        ]
    })

    return initCodeCallData
}

const getDefaultAddresses = (
    safeVersion: SafeVersion,
    entryPointVersion: "0.6" | "0.7",
    {
        addModuleLibAddress: _addModuleLibAddress,
        safeModuleSetupAddress: _safeModuleSetupAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress
    }: {
        addModuleLibAddress?: Address
        safeModuleSetupAddress?: Address
        safe4337ModuleAddress?: Address
        safeProxyFactoryAddress?: Address
        safeSingletonAddress?: Address
        multiSendAddress?: Address
        multiSendCallOnlyAddress?: Address
    }
) => {
    const safeModuleSetupAddress =
        _safeModuleSetupAddress ??
        _addModuleLibAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]
            .SAFE_MODULE_SETUP_ADDRESS
    const safe4337ModuleAddress =
        _safe4337ModuleAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]
            .SAFE_4337_MODULE_ADDRESS
    const safeProxyFactoryAddress =
        _safeProxyFactoryAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]
            .SAFE_PROXY_FACTORY_ADDRESS
    const safeSingletonAddress =
        _safeSingletonAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]
            .SAFE_SINGLETON_ADDRESS
    const multiSendAddress =
        _multiSendAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]
            .MULTI_SEND_ADDRESS

    const multiSendCallOnlyAddress =
        _multiSendCallOnlyAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]
            .MULTI_SEND_CALL_ONLY_ADDRESS

    return {
        safeModuleSetupAddress,
        safe4337ModuleAddress,
        safeProxyFactoryAddress,
        safeSingletonAddress,
        multiSendAddress,
        multiSendCallOnlyAddress
    }
}

type GetErc7579Params<TErc7579 extends Address | undefined> =
    TErc7579 extends undefined
        ? {
              safeModuleSetupAddress?: Address
              multiSendAddress?: Address
              multiSendCallOnlyAddress?: Address
              setupTransactions?: {
                  to: Address
                  data: Address
                  value: bigint
              }[]
              safeModules?: Address[]
          }
        : {
              validators?: { address: Address; context: Address }[]
              executors?: {
                  address: Address
                  context: Address
              }[]
              fallbacks?: { address: Address; context: Address }[]
              hooks?: { address: Address; context: Address }[]
              attesters?: Address[]
              attestersThreshold?: number
          }

export type ToSafeSmartAccountParameters<
    entryPointVersion extends "0.6" | "0.7",
    TErc7579 extends Address | undefined
> = {
    client: Client
    owners: [
        OneOf<
            | EthereumProvider
            | WalletClient<Transport, Chain | undefined, Account>
            | LocalAccount
        >
    ]
    version: SafeVersion
    entryPoint?: {
        address: Address
        version: entryPointVersion
    }
    safe4337ModuleAddress?: Address
    erc7579LaunchpadAddress?: TErc7579
    safeProxyFactoryAddress?: Address
    safeSingletonAddress?: Address
    address?: Address
    saltNonce?: bigint
    validUntil?: number
    validAfter?: number
    nonceKey?: bigint
    paymentToken?: Address
    payment?: bigint
    paymentReceiver?: Address
} & GetErc7579Params<TErc7579>

function isErc7579Args<entryPointVersion extends "0.6" | "0.7" = "0.7">(
    args: ToSafeSmartAccountParameters<entryPointVersion, Address | undefined>
): args is ToSafeSmartAccountParameters<entryPointVersion, Address> {
    return args.erc7579LaunchpadAddress !== undefined
}

const proxyCreationCodeAbi = [
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
] as const

const getAccountAddress = async ({
    client,
    owner,
    safeModuleSetupAddress,
    safe4337ModuleAddress,
    safeProxyFactoryAddress,
    safeSingletonAddress,
    multiSendAddress,
    erc7579LaunchpadAddress,
    paymentToken,
    payment,
    paymentReceiver,
    setupTransactions = [],
    safeModules = [],
    saltNonce = BigInt(0),
    validators = [],
    executors = [],
    fallbacks = [],
    hooks = [],
    attesters = [],
    attestersThreshold = 0
}: {
    client: Client
    owner: Address
    safeModuleSetupAddress: Address
    safe4337ModuleAddress: Address
    safeProxyFactoryAddress: Address
    safeSingletonAddress: Address
    multiSendAddress: Address
    setupTransactions: {
        to: Address
        data: Address
        value: bigint
    }[]
    paymentToken?: Address
    payment?: bigint
    paymentReceiver?: Address
    safeModules?: Address[]
    saltNonce?: bigint
    erc7579LaunchpadAddress?: Address
    validators?: { address: Address; context: Address }[]
    executors?: {
        address: Address
        context: Address
    }[]
    fallbacks?: { address: Address; context: Address }[]
    hooks?: { address: Address; context: Address }[]
    attesters?: Address[]
    attestersThreshold?: number
}): Promise<Address> => {
    const proxyCreationCode = await readContract(client, {
        abi: proxyCreationCodeAbi,
        address: safeProxyFactoryAddress,
        functionName: "proxyCreationCode"
    })

    const initializer = await getInitializerCode({
        owner,
        safeModuleSetupAddress,
        safe4337ModuleAddress,
        multiSendAddress,
        setupTransactions,
        safeSingletonAddress,
        safeModules,
        erc7579LaunchpadAddress,
        validators,
        executors,
        fallbacks,
        hooks,
        attesters,
        attestersThreshold,
        paymentToken,
        payment,
        paymentReceiver
    })

    const deploymentCode = encodePacked(
        ["bytes", "uint256"],
        [
            proxyCreationCode,
            hexToBigInt(erc7579LaunchpadAddress ?? safeSingletonAddress)
        ]
    )

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

export type SafeSmartAccountImplementation<
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

export type ToSafeSmartAccountReturnType<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
> = SmartAccount<SafeSmartAccountImplementation<entryPointVersion>>

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function toSafeSmartAccount<
    entryPointVersion extends "0.6" | "0.7",
    TErc7579 extends Address | undefined
>(
    parameters: ToSafeSmartAccountParameters<entryPointVersion, TErc7579>
): Promise<ToSafeSmartAccountReturnType<entryPointVersion>> {
    const {
        client,
        owners,
        address,
        version,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        erc7579LaunchpadAddress,
        saltNonce = BigInt(0),
        validUntil = 0,
        validAfter = 0,
        nonceKey,
        paymentToken,
        payment,
        paymentReceiver
    } = parameters

    const localOwner = await toOwner({ owner: owners[0] })

    const entryPoint = {
        address: parameters.entryPoint?.address ?? entryPoint07Address,
        abi:
            (parameters.entryPoint?.version ?? "0.7") === "0.6"
                ? entryPoint06Abi
                : entryPoint07Abi,
        version: parameters.entryPoint?.version ?? "0.7"
    } as const

    let _safeModuleSetupAddress: Address | undefined = undefined
    let _multiSendAddress: Address | undefined = undefined
    let _multiSendCallOnlyAddress: Address | undefined = undefined
    let safeModules: Address[] | undefined = undefined
    let setupTransactions: {
        to: `0x${string}`
        data: `0x${string}`
        value: bigint
    }[] = []
    let validators: { address: Address; context: Address }[] = []
    let executors: { address: Address; context: Address }[] = []
    let fallbacks: { address: Address; context: Address }[] = []
    let hooks: { address: Address; context: Address }[] = []
    let attesters: Address[] = []
    let attestersThreshold = 0

    if (!isErc7579Args(parameters)) {
        _safeModuleSetupAddress = parameters.safeModuleSetupAddress
        _multiSendAddress = parameters.multiSendAddress
        _multiSendCallOnlyAddress = parameters.multiSendCallOnlyAddress
        safeModules = parameters.safeModules
        setupTransactions = parameters.setupTransactions ?? []
    }

    if (isErc7579Args(parameters)) {
        validators = parameters.validators ?? []
        executors = parameters.executors ?? []
        fallbacks = parameters.fallbacks ?? []
        hooks = parameters.hooks ?? []
        attesters = parameters.attesters ?? []
        attestersThreshold = parameters.attestersThreshold ?? 0
    }

    const {
        safeModuleSetupAddress,
        safe4337ModuleAddress,
        safeProxyFactoryAddress,
        safeSingletonAddress,
        multiSendAddress,
        multiSendCallOnlyAddress
    } = getDefaultAddresses(version, entryPoint.version, {
        safeModuleSetupAddress: _safeModuleSetupAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress
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
            factory: safeProxyFactoryAddress,
            factoryData: await getAccountInitCode({
                owner: localOwner.address,
                safeModuleSetupAddress,
                safe4337ModuleAddress,
                safeSingletonAddress,
                multiSendAddress,
                erc7579LaunchpadAddress,
                saltNonce,
                setupTransactions,
                safeModules,
                validators,
                executors,
                fallbacks,
                hooks,
                attesters,
                attestersThreshold,
                paymentToken,
                payment,
                paymentReceiver
            })
        }
    }

    return toSmartAccount({
        client,
        entryPoint,
        getFactoryArgs,
        async getAddress() {
            if (accountAddress) return accountAddress

            // Get the sender address based on the init code
            accountAddress = await getAccountAddress({
                client,
                owner: localOwner.address,
                safeModuleSetupAddress,
                safe4337ModuleAddress,
                safeProxyFactoryAddress,
                safeSingletonAddress,
                multiSendAddress,
                erc7579LaunchpadAddress,
                saltNonce,
                setupTransactions,
                safeModules,
                validators,
                executors,
                fallbacks,
                hooks,
                attesters,
                attestersThreshold,
                paymentToken,
                payment,
                paymentReceiver
            })

            return accountAddress
        },
        async encodeCalls(calls) {
            const hasMultipleCalls = calls.length > 1

            if (erc7579LaunchpadAddress) {
                const safeDeployed = await isSmartAccountDeployed(
                    client,
                    await this.getAddress()
                )

                if (!safeDeployed) {
                    const initData = get7579LaunchPadInitData({
                        safe4337ModuleAddress,
                        safeSingletonAddress,
                        erc7579LaunchpadAddress,
                        owner: localOwner.address,
                        validators,
                        executors,
                        fallbacks,
                        hooks,
                        attesters,
                        attestersThreshold
                    })

                    return encodeFunctionData({
                        abi: setupSafeAbi,
                        functionName: "setupSafe",
                        args: [
                            {
                                ...initData,
                                validators: initData.validators.map(
                                    (validator) => ({
                                        module: validator.address,
                                        initData: validator.context
                                    })
                                ),
                                callData: encode7579Calls({
                                    mode: {
                                        type: hasMultipleCalls
                                            ? "batchcall"
                                            : "call",
                                        revertOnError: false,
                                        selector: "0x",
                                        context: "0x"
                                    },
                                    callData: calls
                                })
                            }
                        ]
                    })
                }

                return encode7579Calls({
                    mode: {
                        type: hasMultipleCalls ? "batchcall" : "call",
                        revertOnError: false,
                        selector: "0x",
                        context: "0x"
                    },
                    callData: calls
                })
            }

            let to: Address
            let value: bigint
            let data: Hex
            let operationType = 0

            if (hasMultipleCalls) {
                to = multiSendCallOnlyAddress
                value = BigInt(0)

                data = encodeMultiSend(
                    calls.map((tx) => ({
                        to: tx.to,
                        value: tx.value ?? 0n,
                        data: tx.data ?? "0x",
                        operation: 0
                    }))
                )
                operationType = 1
            } else {
                const call = calls.length === 0 ? undefined : calls[0]

                if (!call) {
                    throw new Error("No calls to encode")
                }

                to = call.to
                data = call.data ?? "0x"
                value = call.value ?? 0n
            }

            return encodeFunctionData({
                abi: executeUserOpWithErrorStringAbi,
                functionName: "executeUserOpWithErrorString",
                args: [to, value, data, operationType]
            })
        },
        async getNonce(args) {
            return getAccountNonce(client, {
                address: await this.getAddress(),
                entryPointAddress: entryPoint.address,
                key: nonceKey ?? args?.key
            })
        },
        async getStubSignature() {
            return "0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        async signMessage({ message }) {
            const messageHash = hashTypedData({
                domain: {
                    chainId: await getMemoizedChainId(),
                    verifyingContract: await this.getAddress()
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
                await localOwner.signMessage({
                    message: {
                        raw: toBytes(messageHash)
                    }
                })
            )
        },
        async signTypedData(typedData) {
            return adjustVInSignature(
                "eth_signTypedData",
                await localOwner.signTypedData({
                    domain: {
                        chainId: await getMemoizedChainId(),
                        verifyingContract: await this.getAddress()
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
        },
        async signUserOperation(parameters) {
            const { chainId = await getMemoizedChainId(), ...userOperation } =
                parameters

            const message = {
                safe: await this.getAddress(),
                callData: userOperation.callData,
                nonce: userOperation.nonce,
                initCode: userOperation.initCode ?? "0x",
                maxFeePerGas: userOperation.maxFeePerGas,
                maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
                preVerificationGas: userOperation.preVerificationGas,
                verificationGasLimit: userOperation.verificationGasLimit,
                callGasLimit: userOperation.callGasLimit,
                paymasterAndData: userOperation.paymasterAndData ?? "0x",
                validAfter: validAfter,
                validUntil: validUntil,
                entryPoint: entryPoint.address
            }

            if ("initCode" in userOperation) {
                message.paymasterAndData =
                    userOperation.paymasterAndData ?? "0x"
            }

            if ("factory" in userOperation) {
                if (userOperation.factory && userOperation.factoryData) {
                    message.initCode = concatHex([
                        userOperation.factory,
                        userOperation.factoryData
                    ])
                }
                message.paymasterAndData = getPaymasterAndData({
                    ...userOperation,
                    sender: userOperation.sender ?? (await this.getAddress())
                })
            }

            const signatures = [
                {
                    signer: localOwner.address,
                    data: await signTypedData(client, {
                        account: localOwner,
                        domain: {
                            chainId,
                            verifyingContract: safe4337ModuleAddress
                        },
                        types:
                            entryPoint.version === "0.6"
                                ? EIP712_SAFE_OPERATION_TYPE_V06
                                : EIP712_SAFE_OPERATION_TYPE_V07,
                        primaryType: "SafeOp",
                        message: message
                    })
                }
            ]

            signatures.sort((left, right) =>
                left.signer
                    .toLowerCase()
                    .localeCompare(right.signer.toLowerCase())
            )

            const signatureBytes = concat(signatures.map((sig) => sig.data))

            return encodePacked(
                ["uint48", "uint48", "bytes"],
                [validAfter, validUntil, signatureBytes]
            )
        }
    }) as Promise<ToSafeSmartAccountReturnType<entryPointVersion>>
}
