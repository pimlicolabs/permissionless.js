import { PublicKey } from "ox"
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
    type SignableMessage,
    type Transport,
    type TypedData,
    type TypedDataDefinition,
    type WalletClient,
    concat,
    decodeFunctionData,
    encodeAbiParameters,
    encodeFunctionData,
    encodePacked,
    getAddress,
    getContractAddress,
    hashMessage,
    hashTypedData,
    hexToBigInt,
    keccak256,
    pad,
    size,
    slice,
    toBytes,
    toHex,
    zeroAddress
} from "viem"
import {
    type SmartAccount,
    type SmartAccountImplementation,
    type UserOperation,
    type WebAuthnAccount,
    entryPoint06Abi,
    entryPoint07Abi,
    entryPoint07Address,
    toSmartAccount
} from "viem/account-abstraction"
import { getChainId, readContract } from "viem/actions"
import { getAction } from "viem/utils"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"
import { decode7579Calls } from "../../utils/decode7579Calls.js"
import { encode7579Calls } from "../../utils/encode7579Calls.js"
import { isSmartAccountDeployed } from "../../utils/isSmartAccountDeployed.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"
import {
    concatSignatures,
    getWebAuthnSignature,
    signUserOperation
} from "./signUserOperation.js"

export type SafeVersion = "1.4.1" | "1.5.0"

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

const safeWebAuthnSharedSignerAbi = [
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "uint256",
                        name: "x",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "y",
                        type: "uint256"
                    },
                    {
                        internalType: "P256.Verifiers",
                        name: "verifiers",
                        type: "uint176"
                    }
                ],
                internalType: "struct SafeWebAuthnSharedSigner.Signer",
                name: "signer",
                type: "tuple"
            }
        ],
        name: "configure",
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

export const EIP712_SAFE_OPERATION_TYPE_V06 = {
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

export const EIP712_SAFE_OPERATION_TYPE_V07 = {
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
        "0.6"?: {
            SAFE_MODULE_SETUP_ADDRESS: Address
            SAFE_4337_MODULE_ADDRESS: Address
            SAFE_PROXY_FACTORY_ADDRESS: Address
            SAFE_SINGLETON_ADDRESS: Address
            MULTI_SEND_ADDRESS: Address
            MULTI_SEND_CALL_ONLY_ADDRESS: Address
            WEB_AUTHN_SHARED_SIGNER_ADDRESS?: never
            SAFE_P256_VERIFIER_ADDRESS?: never
        }
        "0.7": {
            SAFE_MODULE_SETUP_ADDRESS: Address
            SAFE_4337_MODULE_ADDRESS: Address
            SAFE_PROXY_FACTORY_ADDRESS: Address
            SAFE_SINGLETON_ADDRESS: Address
            MULTI_SEND_ADDRESS: Address
            MULTI_SEND_CALL_ONLY_ADDRESS: Address
            WEB_AUTHN_SHARED_SIGNER_ADDRESS: Address
            SAFE_P256_VERIFIER_ADDRESS: Address
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
                "0x9641d764fc13c8B624c04430C7356C1C7C8102e2",
            WEB_AUTHN_SHARED_SIGNER_ADDRESS:
                "0x94a4F6affBd8975951142c3999aEAB7ecee555c2",
            SAFE_P256_VERIFIER_ADDRESS:
                "0xA86e0054C51E4894D88762a017ECc5E5235f5DBA"
        }
    },
    "1.5.0": {
        "0.7": {
            SAFE_MODULE_SETUP_ADDRESS:
                "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47",
            SAFE_4337_MODULE_ADDRESS:
                "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226",
            SAFE_PROXY_FACTORY_ADDRESS:
                "0x14F2982D601c9458F93bd70B218933A6f8165e7b",
            SAFE_SINGLETON_ADDRESS:
                "0xFf51A5898e281Db6DfC7855790607438dF2ca44b",
            MULTI_SEND_ADDRESS: "0x218543288004CD07832472D464648173c77D7eB7",
            MULTI_SEND_CALL_ONLY_ADDRESS:
                "0xA83c336B20401Af773B6219BA5027174338D1836",
            WEB_AUTHN_SHARED_SIGNER_ADDRESS:
                "0x94a4F6affBd8975951142c3999aEAB7ecee555c2",
            SAFE_P256_VERIFIER_ADDRESS:
                "0xA86e0054C51E4894D88762a017ECc5E5235f5DBA"
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
        // uint8 = 1 byte for operation
        // address = 20 bytes for to address
        // uint256 = 32 bytes for value
        // uint256 = 32 bytes for data length
        // bytes = dynamic length for data
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
    safeWebAuthnSharedSignerAddress,
    owners,
    validators,
    executors,
    fallbacks,
    hooks,
    attesters,
    threshold,
    attestersThreshold
}: {
    safe4337ModuleAddress: Address
    safeSingletonAddress: Address
    erc7579LaunchpadAddress: Address
    safeWebAuthnSharedSignerAddress?: Address
    owners: OwnersArray<readonly (RegularOwner | WebAuthnAccount)[]>
    executors: {
        address: Address
        context: Address
    }[]
    validators: { address: Address; context: Address }[]
    fallbacks: { address: Address; context: Address }[]
    hooks: { address: Address; context: Address }[]
    attesters: Address[]
    threshold: bigint
    attestersThreshold: number
}) => {
    const ownerAddresses = owners.map((owner) => {
        if ("type" in owner && owner.type === "webAuthn") {
            if (!safeWebAuthnSharedSignerAddress) {
                throw new Error("safeWebAuthnSharedSignerAddress not defined")
            }
            return safeWebAuthnSharedSignerAddress
        }

        if ("address" in owner && owner.address) {
            return owner.address
        }

        throw new Error("Incorrect owner found")
    })

    const initData = {
        singleton: safeSingletonAddress,
        owners: ownerAddresses,
        threshold: threshold,
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
                attesters.sort((left, right) =>
                    left.toLowerCase().localeCompare(right.toLowerCase())
                ),
                attestersThreshold
            ]
        }),
        safe7579: safe4337ModuleAddress,
        validators: validators
    }

    return initData
}

export const isWebAuthnAccount = (
    owner: RegularOwner | WebAuthnAccount
): owner is WebAuthnAccount => {
    return "type" in owner && owner.type === "webAuthn"
}

const getInitializerCode = async ({
    owners,
    threshold,
    safeModuleSetupAddress,
    safe4337ModuleAddress,
    safeWebAuthnSharedSignerAddress,
    safeP256VerifierAddress,
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
    owners: OwnersArray<readonly (RegularOwner | WebAuthnAccount)[]>
    threshold: bigint
    safeSingletonAddress: Address
    safeModuleSetupAddress: Address
    safe4337ModuleAddress: Address
    safeWebAuthnSharedSignerAddress?: Address
    safeP256VerifierAddress?: Address
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
            safeWebAuthnSharedSignerAddress,
            erc7579LaunchpadAddress,
            owners,
            validators,
            executors,
            fallbacks,
            threshold,
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

    const webAuthnOwner = owners.reduce<WebAuthnAccount | undefined>(
        (acc, owner) => {
            if (isWebAuthnAccount(owner)) {
                return owner
            }
            return acc
        },
        undefined
    )

    const ownerAddresses = owners.map((owner) => {
        if (isWebAuthnAccount(owner)) {
            if (!safeWebAuthnSharedSignerAddress) {
                throw new Error("safeWebAuthnSharedSignerAddress not defined")
            }
            return safeWebAuthnSharedSignerAddress
        }

        if ("address" in owner && owner.address) {
            return owner.address
        }

        throw new Error("Incorrect owner found")
    })

    const multiCalls = [
        {
            to: safeModuleSetupAddress,
            data: encodeFunctionData({
                abi: enableModulesAbi,
                functionName: "enableModules",
                args: [[safe4337ModuleAddress, ...safeModules]]
            }),
            value: BigInt(0),
            operation: 1 as 0 | 1
        }
    ]

    if (
        webAuthnOwner &&
        safeWebAuthnSharedSignerAddress &&
        safeP256VerifierAddress
    ) {
        const parsedPublicKey = PublicKey.fromHex(webAuthnOwner.publicKey)

        multiCalls.push({
            to: safeWebAuthnSharedSignerAddress,
            data: encodeFunctionData({
                abi: safeWebAuthnSharedSignerAbi,
                functionName: "configure",
                args: [
                    {
                        x: parsedPublicKey.x,
                        y: parsedPublicKey.y,
                        verifiers: BigInt(safeP256VerifierAddress)
                    }
                ]
            }),
            value: BigInt(0),
            operation: 1 as 0 | 1
        })
    }

    for (const tx of setupTransactions) {
        multiCalls.push({
            ...tx,
            operation: 0 as 0 | 1
        })
    }

    const multiSendCallData = encodeMultiSend(multiCalls)

    return encodeFunctionData({
        abi: setupAbi,
        functionName: "setup",
        args: [
            ownerAddresses,
            threshold,
            multiSendAddress,
            multiSendCallData,
            safe4337ModuleAddress,
            paymentToken,
            payment,
            paymentReceiver
        ]
    })
}

export function getPaymasterAndData(unpackedUserOperation: UserOperation) {
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
    owners,
    threshold,
    safeModuleSetupAddress,
    safe4337ModuleAddress,
    safeSingletonAddress,
    erc7579LaunchpadAddress,
    safeWebAuthnSharedSignerAddress,
    safeP256VerifierAddress,
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
    owners: OwnersArray<readonly (RegularOwner | WebAuthnAccount)[]>
    threshold: bigint
    safeModuleSetupAddress: Address
    safe4337ModuleAddress: Address
    safeSingletonAddress: Address
    multiSendAddress: Address
    safeWebAuthnSharedSignerAddress?: Address
    safeP256VerifierAddress?: Address
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
    const initializer = await getInitializerCode({
        owners,
        threshold,
        safeModuleSetupAddress,
        safeWebAuthnSharedSignerAddress,
        safeP256VerifierAddress,
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

export const getDefaultAddresses = (
    safeVersion: SafeVersion,
    entryPointVersion: "0.6" | "0.7",
    {
        addModuleLibAddress: _addModuleLibAddress,
        safeModuleSetupAddress: _safeModuleSetupAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress,
        safeWebAuthnSharedSignerAddress: _safeWebAuthnSharedSignerAddress,
        safeP256VerifierAddress: _safeP256VerifierAddress
    }: {
        addModuleLibAddress?: Address
        safeModuleSetupAddress?: Address
        safe4337ModuleAddress?: Address
        safeProxyFactoryAddress?: Address
        safeSingletonAddress?: Address
        multiSendAddress?: Address
        multiSendCallOnlyAddress?: Address
        safeWebAuthnSharedSignerAddress?: Address
        safeP256VerifierAddress?: Address
    }
) => {
    const versionAddresses =
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]

    if (!versionAddresses) {
        throw new Error(
            `Safe version ${safeVersion} does not support EntryPoint version ${entryPointVersion}`
        )
    }

    const safeModuleSetupAddress =
        _safeModuleSetupAddress ??
        _addModuleLibAddress ??
        versionAddresses.SAFE_MODULE_SETUP_ADDRESS
    const safe4337ModuleAddress =
        _safe4337ModuleAddress ?? versionAddresses.SAFE_4337_MODULE_ADDRESS
    const safeProxyFactoryAddress =
        _safeProxyFactoryAddress ?? versionAddresses.SAFE_PROXY_FACTORY_ADDRESS
    const safeSingletonAddress =
        _safeSingletonAddress ?? versionAddresses.SAFE_SINGLETON_ADDRESS
    const multiSendAddress =
        _multiSendAddress ?? versionAddresses.MULTI_SEND_ADDRESS

    const multiSendCallOnlyAddress =
        _multiSendCallOnlyAddress ??
        versionAddresses.MULTI_SEND_CALL_ONLY_ADDRESS

    const safeWebAuthnSharedSignerAddress =
        _safeWebAuthnSharedSignerAddress ??
        versionAddresses.WEB_AUTHN_SHARED_SIGNER_ADDRESS
    const safeP256VerifierAddress =
        _safeP256VerifierAddress ?? versionAddresses.SAFE_P256_VERIFIER_ADDRESS

    return {
        safeModuleSetupAddress,
        safe4337ModuleAddress,
        safeProxyFactoryAddress,
        safeSingletonAddress,
        multiSendAddress,
        multiSendCallOnlyAddress,
        safeWebAuthnSharedSignerAddress,
        safeP256VerifierAddress
    }
}

type GetErc7579Params<TErc7579 extends Address | undefined> =
    TErc7579 extends undefined
        ? {
              safeModuleSetupAddress?: Address
              multiSendAddress?: Address
              multiSendCallOnlyAddress?: Address
              // @deprecated This field is deprecated. It is recommended to make any setup transactions in the userOperation's calldata.
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

type RegularOwner =
    | Account
    | WalletClient<Transport, Chain | undefined, Account>
    | EthereumProvider

type ValidateAtMostOneWebAuthn<
    T extends readonly unknown[],
    SeenWebAuthn extends boolean = false
> = T extends readonly []
    ? true
    : T extends readonly [infer H, ...infer Rest]
      ? H extends WebAuthnAccount
          ? SeenWebAuthn extends true
              ? false
              : ValidateAtMostOneWebAuthn<Rest, true>
          : H extends RegularOwner
            ? ValidateAtMostOneWebAuthn<Rest, SeenWebAuthn>
            : false
      : true

type OwnersArray<T extends readonly (RegularOwner | WebAuthnAccount)[]> =
    ValidateAtMostOneWebAuthn<T> extends true ? T : never

export type ToSafeSmartAccountParameters<
    entryPointVersion extends "0.6" | "0.7",
    TErc7579 extends Address | undefined
> = {
    client: Client<
        Transport,
        Chain | undefined,
        JsonRpcAccount | LocalAccount | undefined
    >
    owners: OwnersArray<readonly (RegularOwner | WebAuthnAccount)[]>
    threshold?: bigint
    version: SafeVersion
    entryPoint?: {
        address: Address
        version: entryPointVersion
    }
    safe4337ModuleAddress?: Address
    erc7579LaunchpadAddress?: TErc7579
    safeProxyFactoryAddress?: Address
    safeSingletonAddress?: Address
    safeWebAuthnSharedSignerAddress?: Address
    safeP256VerifierAddress?: Address
    address?: Address
    saltNonce?: bigint
    validUntil?: number
    validAfter?: number
    nonceKey?: bigint
    paymentToken?: Address
    payment?: bigint
    paymentReceiver?: Address
    onchainIdentifier?: Hex
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
    owners,
    threshold,
    safeModuleSetupAddress,
    safe4337ModuleAddress,
    safeProxyFactoryAddress,
    safeSingletonAddress,
    multiSendAddress,
    safeWebAuthnSharedSignerAddress,
    safeP256VerifierAddress,
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
    owners: OwnersArray<readonly (RegularOwner | WebAuthnAccount)[]>
    threshold: bigint
    safeModuleSetupAddress: Address
    safe4337ModuleAddress: Address
    safeProxyFactoryAddress: Address
    safeSingletonAddress: Address
    safeWebAuthnSharedSignerAddress?: Address
    safeP256VerifierAddress?: Address
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
        owners,
        threshold,
        safeModuleSetupAddress,
        safe4337ModuleAddress,
        safeWebAuthnSharedSignerAddress,
        safeP256VerifierAddress,
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
        owners: _owners,
        address,
        threshold = BigInt(_owners.length),
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
        paymentReceiver,
        onchainIdentifier
    } = parameters

    const owners = await Promise.all(
        _owners.map(async (owner) => {
            if ("account" in owner) {
                return owner.account
            }

            if ("request" in owner) {
                return toOwner({
                    owner: owner as EthereumProvider
                })
            }

            return owner
        })
    )

    const localOwners = await Promise.all(
        _owners
            .filter((owner) => {
                if ("type" in owner && owner.type === "local") {
                    return true
                }

                if ("request" in owner) {
                    return true
                }

                if ("account" in owner) {
                    // walletClient
                    return true
                }

                if (isWebAuthnAccount(owner)) {
                    return true
                }

                return false
            })
            .map((owner) => {
                if (isWebAuthnAccount(owner)) {
                    return owner
                }

                return toOwner({
                    owner: owner as OneOf<
                        | LocalAccount
                        | EthereumProvider
                        | WalletClient<Transport, Chain | undefined, Account>
                    >
                })
            })
    )

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
        to: Address
        data: Hex
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
        multiSendCallOnlyAddress,
        safeWebAuthnSharedSignerAddress,
        safeP256VerifierAddress
    } = getDefaultAddresses(version, entryPoint.version, {
        safeModuleSetupAddress: _safeModuleSetupAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress,
        safeWebAuthnSharedSignerAddress:
            parameters.safeWebAuthnSharedSignerAddress,
        safeP256VerifierAddress: parameters.safeP256VerifierAddress
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
                owners,
                threshold,
                safeModuleSetupAddress,
                safe4337ModuleAddress,
                safeSingletonAddress,
                safeWebAuthnSharedSignerAddress,
                safeP256VerifierAddress,
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
                owners,
                threshold,
                safeModuleSetupAddress,
                safe4337ModuleAddress,
                safeProxyFactoryAddress,
                safeSingletonAddress,
                safeWebAuthnSharedSignerAddress,
                safeP256VerifierAddress,
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
                        safeWebAuthnSharedSignerAddress,
                        owners,
                        threshold,
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

            const calldata = encodeFunctionData({
                abi: executeUserOpWithErrorStringAbi,
                functionName: "executeUserOpWithErrorString",
                args: [to, value, data, operationType]
            })

            if (onchainIdentifier) {
                return concat([calldata, onchainIdentifier])
            }

            return calldata
        },
        async decodeCalls(callData) {
            try {
                const decoded = decodeFunctionData({
                    abi: setupSafeAbi,
                    data: callData
                })

                return decode7579Calls(decoded.args[0].callData).callData
            } catch (_) {}

            try {
                return decode7579Calls(callData).callData
            } catch (_) {}

            const decoded = decodeFunctionData({
                abi: executeUserOpWithErrorStringAbi,
                data: callData
            })

            const to = decoded.args[0]
            const value = decoded.args[1]
            const data = decoded.args[2]

            if (to === multiSendCallOnlyAddress) {
                const decodedMultiSend = decodeFunctionData({
                    abi: multiSendAbi,
                    data: data
                })

                const dataToDecode = decodedMultiSend.args[0]
                const transactions: {
                    to: Address
                    value: bigint
                    data: Hex
                }[] = []

                let position = 0
                const dataLength = size(dataToDecode)

                while (position < dataLength) {
                    // skip the operation type
                    position += 1

                    const to = getAddress(
                        slice(dataToDecode, position, position + 20)
                    )
                    position += 20

                    const value = BigInt(
                        slice(dataToDecode, position, position + 32)
                    )
                    position += 32

                    const dataLength = Number(
                        BigInt(slice(dataToDecode, position, position + 32)) *
                            BigInt(2)
                    )

                    position += 32

                    const data = slice(
                        dataToDecode,
                        position,
                        position + dataLength
                    )
                    position += dataLength

                    transactions.push({ to, value, data })
                }

                return transactions
            }

            return [{ to, value, data }]
        },
        async getNonce(args) {
            return getAccountNonce(client, {
                address: await this.getAddress(),
                entryPointAddress: entryPoint.address,
                key: nonceKey ?? args?.key
            })
        },
        async getStubSignature() {
            const signatures = owners.map((owner) => {
                let signer = safeWebAuthnSharedSignerAddress
                let dynamic = true
                let data: Hex =
                    "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"

                if (!isWebAuthnAccount(owner)) {
                    signer = owner.address
                    dynamic = false
                } else {
                    data = encodeAbiParameters(
                        [
                            { name: "authenticatorData", type: "bytes" },
                            { name: "clientDataJSON", type: "string" },
                            { name: "signature", type: "uint256[2]" }
                        ],
                        [
                            "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d00000000",
                            '"origin":"http://somelargdomainheresothatwehaveenoughbytes.com","crossOrigin":false',
                            [
                                44941127272049826721201904734628716258498742255959991581049806490182030242267n,
                                9910254599581058084911561569808925251374718953855182016200087235935345969636n
                            ]
                        ]
                    )
                }

                if (!signer) {
                    throw new Error("No signer found")
                }

                return {
                    signer,
                    data,
                    dynamic
                }
            })

            return encodePacked(
                ["uint48", "uint48", "bytes"],
                [0, 0, concatSignatures(signatures)]
            )
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        async signMessage({ message }) {
            if (localOwners.length < Number(threshold)) {
                throw new Error(
                    "Owners length mismatch, currently not supported"
                )
            }

            if (erc7579LaunchpadAddress && version === "1.5.0") {
                throw new Error("Safe 7579 & version 1.5.0 are not compatible")
            }

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

            const signatures = await Promise.all(
                localOwners.map(async (localOwner) => {
                    let signer = safeWebAuthnSharedSignerAddress
                    let data: Hex
                    let dynamic = true

                    if (!isWebAuthnAccount(localOwner)) {
                        signer = localOwner.address
                        data = adjustVInSignature(
                            "eth_sign",
                            await localOwner.signMessage({
                                message: {
                                    raw: toBytes(messageHash)
                                }
                            })
                        )
                        dynamic = false
                    } else {
                        data = await getWebAuthnSignature({
                            owner: localOwner,
                            hash: messageHash
                        })
                    }

                    if (!signer) {
                        throw new Error("no signer found")
                    }

                    return {
                        signer,
                        dynamic,
                        data
                    }
                })
            )

            const signatureBytes = concatSignatures(signatures)

            return erc7579LaunchpadAddress
                ? concat([zeroAddress, signatureBytes])
                : signatureBytes
        },
        async signTypedData(typedData) {
            if (localOwners.length < Number(threshold)) {
                throw new Error(
                    "Owners length mismatch, currently not supported"
                )
            }

            if (erc7579LaunchpadAddress && version === "1.5.0") {
                throw new Error("Safe 7579 & version 1.5.0 are not compatible")
            }

            const signatures = await Promise.all(
                localOwners.map(async (localOwner) => {
                    let signer = safeWebAuthnSharedSignerAddress
                    let data: Hex
                    let dynamic = true

                    if (!isWebAuthnAccount(localOwner)) {
                        signer = localOwner.address
                        data = adjustVInSignature(
                            "eth_signTypedData",
                            await localOwner.signTypedData({
                                domain: {
                                    chainId: await getMemoizedChainId(),
                                    verifyingContract: await this.getAddress()
                                },
                                types: {
                                    SafeMessage: [
                                        { name: "message", type: "bytes" }
                                    ]
                                },
                                primaryType: "SafeMessage",
                                message: {
                                    message:
                                        generateSafeMessageMessage(typedData)
                                }
                            })
                        )
                        dynamic = false
                    } else {
                        const messageHash = hashTypedData({
                            domain: {
                                chainId: await getMemoizedChainId(),
                                verifyingContract: await this.getAddress()
                            },
                            types: {
                                SafeMessage: [
                                    { name: "message", type: "bytes" }
                                ]
                            },
                            primaryType: "SafeMessage",
                            message: {
                                message: generateSafeMessageMessage(typedData)
                            }
                        })

                        data = await getWebAuthnSignature({
                            owner: localOwner,
                            hash: messageHash
                        })
                    }

                    if (!signer) {
                        throw new Error("no signer found")
                    }

                    return {
                        signer,
                        dynamic,
                        data
                    }
                })
            )

            const signatureBytes = concatSignatures(signatures)

            return erc7579LaunchpadAddress
                ? concat([zeroAddress, signatureBytes])
                : signatureBytes
        },
        async signUserOperation(parameters) {
            const { chainId = await getMemoizedChainId(), ...userOperation } =
                parameters

            if (localOwners.length < Number(threshold)) {
                throw new Error(
                    "Owners length mismatch use SafeSmartAccount.signUserOperation from `permissionless/accounts/safe`"
                )
            }

            let signatures: Hex | undefined = undefined

            for (const owner of localOwners) {
                signatures = await signUserOperation({
                    ...userOperation,
                    version,
                    entryPoint,
                    owners: localOwners,
                    account: owner,
                    chainId,
                    signatures,
                    validAfter,
                    validUntil,
                    safe4337ModuleAddress,
                    safeWebAuthnSharedSignerAddress
                })
            }

            if (!signatures) {
                throw new Error("No signatures found")
            }

            return signatures
        }
    }) as Promise<ToSafeSmartAccountReturnType<entryPointVersion>>
}
