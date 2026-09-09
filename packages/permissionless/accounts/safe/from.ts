import { type Account, Actions, type Chain, type Client } from "viem"
import {
    SmartAccount,
    type UserOperation,
    type WebAuthnAccount
} from "viem/erc4337"
import {
    AbiFunction,
    AbiParameters,
    Address,
    ContractAddress,
    Hash,
    Hex,
    PersonalMessage,
    PublicKey,
    TypedData
} from "viem/utils"
import { EmptyCallsError } from "../../errors/account.js"
import {
    SafeEntryPointVersionUnsupportedError,
    SafeErc7579VersionUnsupportedError,
    SafeInsufficientOwnersError,
    SafeInvalidOwnerError,
    SafeInvalidSignatureError,
    SafeWebAuthnSharedSignerAddressMissingError
} from "../../errors/safe.js"
import type { Assign, OneOf } from "../../types/utils.js"
import { decode7579Calls } from "../../utils/decode7579Calls.js"
import { encode7579Calls } from "../../utils/encode7579Calls.js"
import { getAction } from "../../utils/getAction.js"
import { isSmartAccountDeployed } from "../../utils/isSmartAccountDeployed.js"
import { sortAddresses } from "../../utils/sortAddresses.js"
import {
    type EntryPointAbi,
    type EntryPointParameter,
    toEntryPoint
} from "../../utils/toEntryPoint.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"
import { withNonceKey } from "../../utils/withNonceKey.js"
import {
    concatSignatures,
    getWebAuthnSignature,
    signUserOperation
} from "./signUserOperation.js"

export type Version = "1.4.1" | "1.5.0"

export type EntryPointVersion = "0.6" | "0.7"

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
} as const

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
} as const

const SAFE_MESSAGE_TYPE = {
    SafeMessage: [{ name: "message", type: "bytes" }]
} as const

const SAFE_VERSION_TO_ADDRESSES_MAP: {
    [key in Version]: {
        "0.6"?: {
            SAFE_MODULE_SETUP_ADDRESS: Address.Address
            SAFE_4337_MODULE_ADDRESS: Address.Address
            SAFE_PROXY_FACTORY_ADDRESS: Address.Address
            SAFE_SINGLETON_ADDRESS: Address.Address
            MULTI_SEND_ADDRESS: Address.Address
            MULTI_SEND_CALL_ONLY_ADDRESS: Address.Address
            WEB_AUTHN_SHARED_SIGNER_ADDRESS?: never
            SAFE_P256_VERIFIER_ADDRESS?: never
        }
        "0.7": {
            SAFE_MODULE_SETUP_ADDRESS: Address.Address
            SAFE_4337_MODULE_ADDRESS: Address.Address
            SAFE_PROXY_FACTORY_ADDRESS: Address.Address
            SAFE_SINGLETON_ADDRESS: Address.Address
            MULTI_SEND_ADDRESS: Address.Address
            MULTI_SEND_CALL_ONLY_ADDRESS: Address.Address
            WEB_AUTHN_SHARED_SIGNER_ADDRESS: Address.Address
            SAFE_P256_VERIFIER_ADDRESS: Address.Address
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

type Module = { address: Address.Address; context: Hex.Hex }

type WalletClient = Client.Client<Chain.Chain | undefined, Account.Account>

type RegularOwner = Account.Account | WalletClient | EthereumProvider

type Owner = RegularOwner | WebAuthnAccount.Account

type ValidateAtMostOneWebAuthn<
    T extends readonly unknown[],
    SeenWebAuthn extends boolean = false
> = T extends readonly []
    ? true
    : T extends readonly [infer H, ...infer Rest]
      ? H extends WebAuthnAccount.Account
          ? SeenWebAuthn extends true
              ? false
              : ValidateAtMostOneWebAuthn<Rest, true>
          : H extends RegularOwner
            ? ValidateAtMostOneWebAuthn<Rest, SeenWebAuthn>
            : false
      : true

type OwnersArray<T extends readonly Owner[]> =
    ValidateAtMostOneWebAuthn<T> extends true ? T : never

type ResolvedOwner = Account.Account | WebAuthnAccount.Account

const adjustVInSignature = (
    signingMethod: "eth_sign" | "eth_signTypedData",
    signature: string
): Hex.Hex => {
    const ETHEREUM_V_VALUES = [0, 1, 27, 28]
    const MIN_VALID_V_VALUE_FOR_SAFE_ECDSA = 27
    let signatureV = Number.parseInt(signature.slice(-2), 16)
    if (!ETHEREUM_V_VALUES.includes(signatureV)) {
        throw new SafeInvalidSignatureError({ v: signatureV })
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
    return (signature.slice(0, -2) + signatureV.toString(16)) as Hex.Hex
}

const encodeInternalTransaction = (tx: {
    to: Address.Address
    data: Hex.Hex
    value: bigint
    operation: 0 | 1
}): string =>
    AbiParameters.encodePacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [tx.operation, tx.to, tx.value, BigInt(Hex.size(tx.data)), tx.data]
    ).slice(2)

const encodeMultiSend = (
    txs: {
        to: Address.Address
        data: Hex.Hex
        value: bigint
        operation: 0 | 1
    }[]
): Hex.Hex =>
    AbiFunction.encodeData(multiSendAbi, "multiSend", [
        `0x${txs.map((tx) => encodeInternalTransaction(tx)).join("")}`
    ])

export const isWebAuthnAccount = (
    owner: Owner
): owner is WebAuthnAccount.Account =>
    "type" in owner && owner.type === "webAuthn"

const getOwnerAddresses = ({
    owners,
    safeWebAuthnSharedSignerAddress
}: {
    owners: readonly ResolvedOwner[]
    safeWebAuthnSharedSignerAddress?: Address.Address | undefined
}) =>
    owners.map((owner) => {
        if (isWebAuthnAccount(owner)) {
            if (!safeWebAuthnSharedSignerAddress) {
                throw new SafeWebAuthnSharedSignerAddressMissingError()
            }
            return safeWebAuthnSharedSignerAddress
        }
        if ("address" in owner && owner.address) {
            return owner.address
        }
        throw new SafeInvalidOwnerError()
    })

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
    safe4337ModuleAddress: Address.Address
    safeSingletonAddress: Address.Address
    erc7579LaunchpadAddress: Address.Address
    safeWebAuthnSharedSignerAddress?: Address.Address | undefined
    owners: readonly ResolvedOwner[]
    executors: Module[]
    validators: Module[]
    fallbacks: Module[]
    hooks: Module[]
    attesters: Address.Address[]
    threshold: bigint
    attestersThreshold: number
}) => ({
    singleton: safeSingletonAddress,
    owners: getOwnerAddresses({ owners, safeWebAuthnSharedSignerAddress }),
    threshold,
    setupTo: erc7579LaunchpadAddress,
    setupData: AbiFunction.encodeData(initSafe7579Abi, "initSafe7579", [
        safe4337ModuleAddress,
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
        sortAddresses(attesters),
        attestersThreshold
    ]),
    safe7579: safe4337ModuleAddress,
    validators: validators.map((validator) => ({
        module: validator.address,
        initData: validator.context
    }))
})

type InitializerParameters = {
    owners: readonly ResolvedOwner[]
    threshold: bigint
    safeSingletonAddress: Address.Address
    safeModuleSetupAddress: Address.Address
    safe4337ModuleAddress: Address.Address
    safeWebAuthnSharedSignerAddress?: Address.Address | undefined
    safeP256VerifierAddress?: Address.Address | undefined
    multiSendAddress: Address.Address
    erc7579LaunchpadAddress?: Address.Address | undefined
    safeModules: Address.Address[]
    useMultiSendForSetup: boolean
    validators: Module[]
    executors: Module[]
    fallbacks: Module[]
    hooks: Module[]
    attesters: Address.Address[]
    attestersThreshold: number
    paymentToken: Address.Address
    payment: bigint
    paymentReceiver: Address.Address
}

const getInitializerCode = ({
    owners,
    threshold,
    safeModuleSetupAddress,
    safe4337ModuleAddress,
    safeWebAuthnSharedSignerAddress,
    safeP256VerifierAddress,
    multiSendAddress,
    safeSingletonAddress,
    erc7579LaunchpadAddress,
    safeModules,
    useMultiSendForSetup,
    validators,
    executors,
    fallbacks,
    hooks,
    attesters,
    attestersThreshold,
    paymentToken,
    payment,
    paymentReceiver
}: InitializerParameters): Hex.Hex => {
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

        const initHash = Hash.keccak256(
            AbiParameters.encode(
                [
                    { name: "singleton", type: "address" },
                    { name: "owners", type: "address[]" },
                    { name: "threshold", type: "uint256" },
                    { name: "setupTo", type: "address" },
                    { name: "setupData", type: "bytes" },
                    { name: "safe7579", type: "address" },
                    {
                        name: "validators",
                        type: "tuple[]",
                        components: [
                            { name: "module", type: "address" },
                            { name: "initData", type: "bytes" }
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
                    initData.validators
                ]
            )
        )

        return AbiFunction.encodeData(
            preValidationSetupAbi,
            "preValidationSetup",
            [initHash, Address.zero, "0x"]
        )
    }

    const webAuthnOwner = owners.find(isWebAuthnAccount)
    const ownerAddresses = getOwnerAddresses({
        owners,
        safeWebAuthnSharedSignerAddress
    })

    const multiCalls: {
        to: Address.Address
        data: Hex.Hex
        value: bigint
        operation: 0 | 1
    }[] = [
        {
            to: safeModuleSetupAddress,
            data: AbiFunction.encodeData(enableModulesAbi, "enableModules", [
                [safe4337ModuleAddress, ...safeModules]
            ]),
            value: 0n,
            operation: 1
        }
    ]

    if (
        webAuthnOwner &&
        safeWebAuthnSharedSignerAddress &&
        safeP256VerifierAddress
    ) {
        const { x, y } = PublicKey.fromHex(webAuthnOwner.publicKey)
        multiCalls.push({
            to: safeWebAuthnSharedSignerAddress,
            data: AbiFunction.encodeData(
                safeWebAuthnSharedSignerAbi,
                "configure",
                [
                    {
                        x: Hex.toBigInt(x),
                        y: Hex.toBigInt(y),
                        verifiers: BigInt(safeP256VerifierAddress)
                    }
                ]
            ),
            value: 0n,
            operation: 1
        })
    }

    const firstMultiCall = multiCalls[0]

    if (!useMultiSendForSetup && multiCalls.length === 1 && firstMultiCall) {
        return AbiFunction.encodeData(setupAbi, "setup", [
            ownerAddresses,
            threshold,
            firstMultiCall.to,
            firstMultiCall.data,
            safe4337ModuleAddress,
            paymentToken,
            payment,
            paymentReceiver
        ])
    }

    return AbiFunction.encodeData(setupAbi, "setup", [
        ownerAddresses,
        threshold,
        multiSendAddress,
        encodeMultiSend(multiCalls),
        safe4337ModuleAddress,
        paymentToken,
        payment,
        paymentReceiver
    ])
}

export function getPaymasterAndData(
    userOperation: Pick<
        UserOperation.UserOperation<"0.7">,
        | "paymaster"
        | "paymasterVerificationGasLimit"
        | "paymasterPostOpGasLimit"
        | "paymasterData"
    >
): Hex.Hex {
    return userOperation.paymaster
        ? Hex.concat(
              userOperation.paymaster,
              Hex.fromNumber(
                  userOperation.paymasterVerificationGasLimit ?? 0n,
                  { size: 16 }
              ),
              Hex.fromNumber(userOperation.paymasterPostOpGasLimit ?? 0n, {
                  size: 16
              }),
              userOperation.paymasterData ?? "0x"
          )
        : "0x"
}

const getAccountInitCode = ({
    saltNonce,
    ...parameters
}: InitializerParameters & { saltNonce: bigint }): Hex.Hex =>
    AbiFunction.encodeData(createProxyWithNonceAbi, "createProxyWithNonce", [
        parameters.erc7579LaunchpadAddress ?? parameters.safeSingletonAddress,
        getInitializerCode(parameters),
        saltNonce
    ])

export const getDefaultAddresses = (
    version: Version,
    entryPointVersion: EntryPointVersion,
    {
        safeModuleSetupAddress: _safeModuleSetupAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress,
        safeWebAuthnSharedSignerAddress: _safeWebAuthnSharedSignerAddress,
        safeP256VerifierAddress: _safeP256VerifierAddress
    }: {
        safeModuleSetupAddress?: Address.Address | undefined
        safe4337ModuleAddress?: Address.Address | undefined
        safeProxyFactoryAddress?: Address.Address | undefined
        safeSingletonAddress?: Address.Address | undefined
        multiSendAddress?: Address.Address | undefined
        multiSendCallOnlyAddress?: Address.Address | undefined
        safeWebAuthnSharedSignerAddress?: Address.Address | undefined
        safeP256VerifierAddress?: Address.Address | undefined
    }
) => {
    const versionAddresses =
        SAFE_VERSION_TO_ADDRESSES_MAP[version][entryPointVersion]

    if (!versionAddresses) {
        throw new SafeEntryPointVersionUnsupportedError({
            version,
            entryPointVersion
        })
    }

    return {
        safeModuleSetupAddress:
            _safeModuleSetupAddress ??
            versionAddresses.SAFE_MODULE_SETUP_ADDRESS,
        safe4337ModuleAddress:
            _safe4337ModuleAddress ?? versionAddresses.SAFE_4337_MODULE_ADDRESS,
        safeProxyFactoryAddress:
            _safeProxyFactoryAddress ??
            versionAddresses.SAFE_PROXY_FACTORY_ADDRESS,
        safeSingletonAddress:
            _safeSingletonAddress ?? versionAddresses.SAFE_SINGLETON_ADDRESS,
        multiSendAddress:
            _multiSendAddress ?? versionAddresses.MULTI_SEND_ADDRESS,
        multiSendCallOnlyAddress:
            _multiSendCallOnlyAddress ??
            versionAddresses.MULTI_SEND_CALL_ONLY_ADDRESS,
        safeWebAuthnSharedSignerAddress:
            _safeWebAuthnSharedSignerAddress ??
            versionAddresses.WEB_AUTHN_SHARED_SIGNER_ADDRESS,
        safeP256VerifierAddress:
            _safeP256VerifierAddress ??
            versionAddresses.SAFE_P256_VERIFIER_ADDRESS
    }
}

const getAccountAddress = async ({
    client,
    safeProxyFactoryAddress,
    saltNonce,
    ...parameters
}: InitializerParameters & {
    client: Client.Client
    safeProxyFactoryAddress: Address.Address
    saltNonce: bigint
}): Promise<Address.Address> => {
    const proxyCreationCode = await getAction(
        client,
        Actions.contract.read,
        "contract.read"
    )({
        abi: proxyCreationCodeAbi,
        address: safeProxyFactoryAddress,
        functionName: "proxyCreationCode"
    })

    const initializer = getInitializerCode(parameters)

    const deploymentCode = AbiParameters.encodePacked(
        ["bytes", "uint256"],
        [
            proxyCreationCode,
            Hex.toBigInt(
                parameters.erc7579LaunchpadAddress ??
                    parameters.safeSingletonAddress
            )
        ]
    )

    const salt = Hash.keccak256(
        AbiParameters.encodePacked(
            ["bytes32", "uint256"],
            [Hash.keccak256(initializer), saltNonce]
        )
    )

    return Address.checksum(
        ContractAddress.fromCreate2({
            from: safeProxyFactoryAddress,
            salt,
            bytecode: deploymentCode
        })
    )
}

type GetErc7579Params<erc7579 extends Address.Address | undefined> =
    erc7579 extends undefined
        ? {
              safeModuleSetupAddress?: Address.Address | undefined
              multiSendAddress?: Address.Address | undefined
              multiSendCallOnlyAddress?: Address.Address | undefined
              safeModules?: Address.Address[] | undefined
          }
        : {
              validators?: Module[] | undefined
              executors?: Module[] | undefined
              fallbacks?: Module[] | undefined
              hooks?: Module[] | undefined
              attesters?: Address.Address[] | undefined
              attestersThreshold?: number | undefined
          }

export type Parameters<
    entryPointVersion extends EntryPointVersion = "0.7",
    erc7579 extends Address.Address | undefined = undefined
> = {
    client: Client.Client
    owners: OwnersArray<readonly Owner[]>
    threshold?: bigint | undefined
    version?: Version | undefined
    entryPoint?: EntryPointParameter<entryPointVersion> | undefined
    safe4337ModuleAddress?: Address.Address | undefined
    erc7579LaunchpadAddress?: erc7579
    safeProxyFactoryAddress?: Address.Address | undefined
    safeSingletonAddress?: Address.Address | undefined
    safeWebAuthnSharedSignerAddress?: Address.Address | undefined
    safeP256VerifierAddress?: Address.Address | undefined
    address?: Address.Address | undefined
    saltNonce?: bigint | undefined
    validUntil?: number | undefined
    validAfter?: number | undefined
    nonceKey?: bigint | undefined
    paymentToken?: Address.Address | undefined
    payment?: bigint | undefined
    paymentReceiver?: Address.Address | undefined
    onchainIdentifier?: Hex.Hex | undefined
    useMultiSendForSetup?: boolean | undefined
} & GetErc7579Params<erc7579>

export type Implementation<
    entryPointVersion extends EntryPointVersion = "0.7"
> = Assign<
    SmartAccount.Implementation<
        EntryPointAbi<entryPointVersion>,
        entryPointVersion,
        object,
        false
    >,
    {
        decodeCalls: NonNullable<SmartAccount.Implementation["decodeCalls"]>
        sign: NonNullable<SmartAccount.Implementation["sign"]>
    }
>

export type ReturnType<entryPointVersion extends EntryPointVersion = "0.7"> =
    SmartAccount.SmartAccount<Implementation<entryPointVersion>>

export async function from<
    entryPointVersion extends EntryPointVersion = "0.7",
    erc7579 extends Address.Address | undefined = undefined
>(
    parameters: Parameters<entryPointVersion, erc7579>
): Promise<ReturnType<entryPointVersion>> {
    const {
        client,
        owners: _owners,
        address,
        threshold = BigInt(_owners.length),
        version = "1.4.1",
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        erc7579LaunchpadAddress,
        saltNonce = 0n,
        validUntil = 0,
        validAfter = 0,
        nonceKey,
        paymentToken = Address.zero,
        payment = 0n,
        paymentReceiver = Address.zero,
        onchainIdentifier,
        useMultiSendForSetup = true
    } = parameters

    const entryPoint = toEntryPoint(
        (parameters.entryPoint ??
            "0.7") as EntryPointParameter<entryPointVersion>
    )

    const owners: ResolvedOwner[] = await Promise.all(
        _owners.map(async (owner) => {
            if ("account" in owner) {
                return owner.account
            }
            if ("request" in owner) {
                return toOwner({ owner: owner as EthereumProvider })
            }
            return owner
        })
    )

    const localOwners: (Account.Local | WebAuthnAccount.Account)[] =
        await Promise.all(
            _owners
                .filter(
                    (owner) =>
                        ("type" in owner && owner.type === "local") ||
                        "request" in owner ||
                        "account" in owner ||
                        isWebAuthnAccount(owner)
                )
                .map((owner) => {
                    if (isWebAuthnAccount(owner)) {
                        return owner
                    }
                    return toOwner({
                        owner: owner as OneOf<
                            Account.Local | EthereumProvider | WalletClient
                        >
                    })
                })
        )

    const args: Parameters<EntryPointVersion, Address.Address | undefined> =
        parameters
    const erc7579Args =
        erc7579LaunchpadAddress === undefined
            ? undefined
            : (args as Parameters<EntryPointVersion, Address.Address>)
    const plainArgs =
        erc7579LaunchpadAddress === undefined
            ? (args as Parameters<EntryPointVersion, undefined>)
            : undefined

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
        safeModuleSetupAddress: plainArgs?.safeModuleSetupAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: plainArgs?.multiSendAddress,
        multiSendCallOnlyAddress: plainArgs?.multiSendCallOnlyAddress,
        safeWebAuthnSharedSignerAddress:
            parameters.safeWebAuthnSharedSignerAddress,
        safeP256VerifierAddress: parameters.safeP256VerifierAddress
    })

    const initializerParameters: InitializerParameters = {
        owners,
        threshold,
        safeModuleSetupAddress,
        safe4337ModuleAddress,
        safeSingletonAddress,
        safeWebAuthnSharedSignerAddress,
        safeP256VerifierAddress,
        multiSendAddress,
        erc7579LaunchpadAddress,
        safeModules: plainArgs?.safeModules ?? [],
        useMultiSendForSetup,
        validators: erc7579Args?.validators ?? [],
        executors: erc7579Args?.executors ?? [],
        fallbacks: erc7579Args?.fallbacks ?? [],
        hooks: erc7579Args?.hooks ?? [],
        attesters: erc7579Args?.attesters ?? [],
        attestersThreshold: erc7579Args?.attestersThreshold ?? 0,
        paymentToken,
        payment,
        paymentReceiver
    }

    let chainId: number | undefined
    const getChainId = async () => {
        chainId ??=
            client.chain?.id ??
            (await getAction(
                client,
                Actions.chains.getId,
                "chains.getId"
            )(undefined))
        return chainId
    }

    let accountAddress: Address.Address | undefined = address
    const getAddress = async () => {
        accountAddress ??= await getAccountAddress({
            client,
            safeProxyFactoryAddress,
            saltNonce,
            ...initializerParameters
        })
        return accountAddress
    }

    const toSafeMessageTypedData = async (message: Hex.Hex) =>
        ({
            domain: {
                chainId: await getChainId(),
                verifyingContract: await getAddress()
            },
            types: SAFE_MESSAGE_TYPE,
            primaryType: "SafeMessage",
            message: { message }
        }) as const

    const assertCanSign = () => {
        if (localOwners.length < Number(threshold)) {
            throw new SafeInsufficientOwnersError({
                owners: localOwners.length,
                threshold
            })
        }
        if (erc7579LaunchpadAddress && version === "1.5.0") {
            throw new SafeErc7579VersionUnsupportedError({ version })
        }
    }

    const wrapSignature = (signature: Hex.Hex) =>
        erc7579LaunchpadAddress
            ? Hex.concat(Address.zero, signature)
            : signature

    const signMessage = async ({
        message
    }: {
        message: Account.SignableMessage
    }) => {
        assertCanSign()

        const messageHash = TypedData.getSignPayload(
            await toSafeMessageTypedData(
                PersonalMessage.getSignPayload(
                    typeof message === "string"
                        ? Hex.fromString(message)
                        : message.raw
                )
            )
        )

        const signatures = await Promise.all(
            localOwners.map(async (localOwner) => {
                if (isWebAuthnAccount(localOwner)) {
                    if (!safeWebAuthnSharedSignerAddress) {
                        throw new SafeWebAuthnSharedSignerAddressMissingError()
                    }
                    return {
                        signer: safeWebAuthnSharedSignerAddress,
                        dynamic: true,
                        data: await getWebAuthnSignature({
                            owner: localOwner,
                            hash: messageHash
                        })
                    }
                }
                return {
                    signer: localOwner.address,
                    dynamic: false,
                    data: adjustVInSignature(
                        "eth_sign",
                        await localOwner.signMessage({
                            message: { raw: messageHash }
                        })
                    )
                }
            })
        )

        return wrapSignature(concatSignatures(signatures))
    }

    const account = await SmartAccount.from({
        client,
        entryPoint,
        getFactoryArgs: async () => ({
            factory: safeProxyFactoryAddress,
            factoryData: getAccountInitCode({
                saltNonce,
                ...initializerParameters
            })
        }),
        getAddress,
        async encodeCalls(calls) {
            const hasMultipleCalls = calls.length > 1

            if (erc7579LaunchpadAddress) {
                const callData = encode7579Calls({
                    mode: {
                        type: hasMultipleCalls ? "batchcall" : "call",
                        revertOnError: false,
                        selector: "0x",
                        context: "0x"
                    },
                    callData: calls
                })

                const safeDeployed = await isSmartAccountDeployed(
                    client,
                    await getAddress()
                )

                if (!safeDeployed) {
                    return AbiFunction.encodeData(setupSafeAbi, "setupSafe", [
                        {
                            ...get7579LaunchPadInitData({
                                ...initializerParameters,
                                erc7579LaunchpadAddress
                            }),
                            callData
                        }
                    ])
                }

                return callData
            }

            let to: Address.Address
            let value: bigint
            let data: Hex.Hex
            let operationType = 0

            if (hasMultipleCalls) {
                to = multiSendCallOnlyAddress
                value = 0n
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
                const call = calls[0]
                if (!call) {
                    throw new EmptyCallsError()
                }
                to = call.to
                data = call.data ?? "0x"
                value = call.value ?? 0n
            }

            const calldata = AbiFunction.encodeData(
                executeUserOpWithErrorStringAbi,
                "executeUserOpWithErrorString",
                [to, value, data, operationType]
            )

            return onchainIdentifier
                ? Hex.concat(calldata, onchainIdentifier)
                : calldata
        },
        decodeCalls(callData) {
            try {
                const [initData] = AbiFunction.decodeData(
                    setupSafeAbi,
                    callData
                )
                return decode7579Calls(initData.callData).callData
            } catch {}

            try {
                return decode7579Calls(callData).callData
            } catch {}

            const [to, value, data] = AbiFunction.decodeData(
                executeUserOpWithErrorStringAbi,
                callData
            )

            if (!Address.isEqual(to, multiSendCallOnlyAddress)) {
                return [{ to, value, data }]
            }

            const [transactions] = AbiFunction.decodeData(multiSendAbi, data)
            const calls: {
                to: Address.Address
                value: bigint
                data: Hex.Hex
            }[] = []

            let position = 0
            const length = Hex.size(transactions)

            while (position < length) {
                position += 1
                const to = Address.checksum(
                    Hex.slice(transactions, position, position + 20)
                )
                position += 20
                const value = Hex.toBigInt(
                    Hex.slice(transactions, position, position + 32)
                )
                position += 32
                const dataLength = Number(
                    Hex.toBigInt(
                        Hex.slice(transactions, position, position + 32)
                    )
                )
                position += 32
                const data =
                    dataLength === 0
                        ? "0x"
                        : Hex.slice(
                              transactions,
                              position,
                              position + dataLength
                          )
                position += dataLength
                calls.push({ to, value, data })
            }

            return calls
        },
        getStubSignature() {
            const signatures = owners.map((owner) => {
                if (isWebAuthnAccount(owner)) {
                    if (!safeWebAuthnSharedSignerAddress) {
                        throw new SafeWebAuthnSharedSignerAddressMissingError()
                    }
                    return {
                        signer: safeWebAuthnSharedSignerAddress,
                        dynamic: true,
                        data: AbiParameters.encode(
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
                }
                return {
                    signer: owner.address,
                    dynamic: false,
                    data: "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c" as Hex.Hex
                }
            })

            return AbiParameters.encodePacked(
                ["uint48", "uint48", "bytes"],
                [0, 0, concatSignatures(signatures)]
            )
        },
        sign: ({ hash }) => signMessage({ message: hash }),
        signMessage,
        async signTypedData(typedData) {
            assertCanSign()

            const safeMessageTypedData = await toSafeMessageTypedData(
                TypedData.getSignPayload(
                    typedData as TypedData.encode.Value<
                        TypedData.TypedData,
                        string
                    >
                )
            )

            const signatures = await Promise.all(
                localOwners.map(async (localOwner) => {
                    if (isWebAuthnAccount(localOwner)) {
                        if (!safeWebAuthnSharedSignerAddress) {
                            throw new SafeWebAuthnSharedSignerAddressMissingError()
                        }
                        return {
                            signer: safeWebAuthnSharedSignerAddress,
                            dynamic: true,
                            data: await getWebAuthnSignature({
                                owner: localOwner,
                                hash: TypedData.getSignPayload(
                                    safeMessageTypedData
                                )
                            })
                        }
                    }
                    return {
                        signer: localOwner.address,
                        dynamic: false,
                        data: adjustVInSignature(
                            "eth_signTypedData",
                            await localOwner.signTypedData(safeMessageTypedData)
                        )
                    }
                })
            )

            return wrapSignature(concatSignatures(signatures))
        },
        async signUserOperation(parameters) {
            const { chainId = await getChainId(), ...userOperation } =
                parameters

            if (localOwners.length < Number(threshold)) {
                throw new SafeInsufficientOwnersError({
                    owners: localOwners.length,
                    threshold,
                    metaMessages: [
                        "Collect the remaining signatures with `SafeSmartAccount.signUserOperation`."
                    ]
                })
            }

            const sender = userOperation.sender ?? (await getAddress())

            let signatures: Hex.Hex | undefined

            for (const owner of localOwners) {
                signatures = await signUserOperation({
                    ...userOperation,
                    sender,
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
                throw new SafeInsufficientOwnersError({
                    owners: localOwners.length,
                    threshold
                })
            }

            return signatures
        }
    })

    return withNonceKey(account, {
        nonceKey
    }) as unknown as ReturnType<entryPointVersion>
}
