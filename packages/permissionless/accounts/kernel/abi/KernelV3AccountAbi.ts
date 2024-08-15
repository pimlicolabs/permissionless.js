export const KernelV3InitAbi = [
    {
        type: "function",
        name: "initialize",
        inputs: [
            {
                name: "_rootValidator",
                type: "bytes21",
                internalType: "ValidationId"
            },
            { name: "hook", type: "address", internalType: "contract IHook" },
            { name: "validatorData", type: "bytes", internalType: "bytes" },
            { name: "hookData", type: "bytes", internalType: "bytes" }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    }
] as const

export const KernelV3_1AccountAbi = [
    {
        type: "function",
        name: "initialize",
        inputs: [
            {
                name: "_rootValidator",
                type: "bytes21",
                internalType: "ValidationId"
            },
            { name: "hook", type: "address", internalType: "contract IHook" },
            { name: "validatorData", type: "bytes", internalType: "bytes" },
            { name: "hookData", type: "bytes", internalType: "bytes" },
            { name: "initConfig", type: "bytes[]", internalType: "bytes[]" }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    }
] as const

export const KernelV3ExecuteAbi = [
    {
        type: "function",
        name: "execute",
        inputs: [
            { name: "execMode", type: "bytes32", internalType: "ExecMode" },
            { name: "executionCalldata", type: "bytes", internalType: "bytes" }
        ],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "executeFromExecutor",
        inputs: [
            { name: "execMode", type: "bytes32", internalType: "ExecMode" },
            { name: "executionCalldata", type: "bytes", internalType: "bytes" }
        ],
        outputs: [
            { name: "returnData", type: "bytes[]", internalType: "bytes[]" }
        ],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "executeUserOp",
        inputs: [
            {
                name: "userOp",
                type: "tuple",
                internalType: "struct PackedUserOperation",
                components: [
                    {
                        name: "sender",
                        type: "address",
                        internalType: "address"
                    },
                    { name: "nonce", type: "uint256", internalType: "uint256" },
                    { name: "initCode", type: "bytes", internalType: "bytes" },
                    { name: "callData", type: "bytes", internalType: "bytes" },
                    {
                        name: "accountGasLimits",
                        type: "bytes32",
                        internalType: "bytes32"
                    },
                    {
                        name: "preVerificationGas",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "gasFees",
                        type: "bytes32",
                        internalType: "bytes32"
                    },
                    {
                        name: "paymasterAndData",
                        type: "bytes",
                        internalType: "bytes"
                    },
                    { name: "signature", type: "bytes", internalType: "bytes" }
                ]
            },
            { name: "userOpHash", type: "bytes32", internalType: "bytes32" }
        ],
        outputs: [],
        stateMutability: "payable"
    }
] as const

export const KernelV3AccountAbi = [
    {
        type: "constructor",
        inputs: [
            {
                name: "_entrypoint",
                type: "address",
                internalType: "contract IEntryPoint"
            }
        ],
        stateMutability: "nonpayable"
    },
    { type: "fallback", stateMutability: "payable" },
    { type: "receive", stateMutability: "payable" },
    {
        type: "function",
        name: "accountId",
        inputs: [],
        outputs: [
            {
                name: "accountImplementationId",
                type: "string",
                internalType: "string"
            }
        ],
        stateMutability: "pure"
    },
    {
        type: "function",
        name: "currentNonce",
        inputs: [],
        outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "eip712Domain",
        inputs: [],
        outputs: [
            { name: "fields", type: "bytes1", internalType: "bytes1" },
            { name: "name", type: "string", internalType: "string" },
            { name: "version", type: "string", internalType: "string" },
            { name: "chainId", type: "uint256", internalType: "uint256" },
            {
                name: "verifyingContract",
                type: "address",
                internalType: "address"
            },
            { name: "salt", type: "bytes32", internalType: "bytes32" },
            { name: "extensions", type: "uint256[]", internalType: "uint256[]" }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "entrypoint",
        inputs: [],
        outputs: [
            { name: "", type: "address", internalType: "contract IEntryPoint" }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "execute",
        inputs: [
            { name: "execMode", type: "bytes32", internalType: "ExecMode" },
            { name: "executionCalldata", type: "bytes", internalType: "bytes" }
        ],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "executeFromExecutor",
        inputs: [
            { name: "execMode", type: "bytes32", internalType: "ExecMode" },
            { name: "executionCalldata", type: "bytes", internalType: "bytes" }
        ],
        outputs: [
            { name: "returnData", type: "bytes[]", internalType: "bytes[]" }
        ],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "executeUserOp",
        inputs: [
            {
                name: "userOp",
                type: "tuple",
                internalType: "struct PackedUserOperation",
                components: [
                    {
                        name: "sender",
                        type: "address",
                        internalType: "address"
                    },
                    { name: "nonce", type: "uint256", internalType: "uint256" },
                    { name: "initCode", type: "bytes", internalType: "bytes" },
                    { name: "callData", type: "bytes", internalType: "bytes" },
                    {
                        name: "accountGasLimits",
                        type: "bytes32",
                        internalType: "bytes32"
                    },
                    {
                        name: "preVerificationGas",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "gasFees",
                        type: "bytes32",
                        internalType: "bytes32"
                    },
                    {
                        name: "paymasterAndData",
                        type: "bytes",
                        internalType: "bytes"
                    },
                    { name: "signature", type: "bytes", internalType: "bytes" }
                ]
            },
            { name: "userOpHash", type: "bytes32", internalType: "bytes32" }
        ],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "executorConfig",
        inputs: [
            {
                name: "executor",
                type: "address",
                internalType: "contract IExecutor"
            }
        ],
        outputs: [
            {
                name: "",
                type: "tuple",
                internalType: "struct ExecutorManager.ExecutorConfig",
                components: [
                    {
                        name: "hook",
                        type: "address",
                        internalType: "contract IHook"
                    }
                ]
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "initialize",
        inputs: [
            {
                name: "_rootValidator",
                type: "bytes21",
                internalType: "ValidationId"
            },
            { name: "hook", type: "address", internalType: "contract IHook" },
            { name: "validatorData", type: "bytes", internalType: "bytes" },
            { name: "hookData", type: "bytes", internalType: "bytes" }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "installModule",
        inputs: [
            { name: "moduleType", type: "uint256", internalType: "uint256" },
            { name: "module", type: "address", internalType: "address" },
            { name: "initData", type: "bytes", internalType: "bytes" }
        ],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "installValidations",
        inputs: [
            { name: "vIds", type: "bytes21[]", internalType: "ValidationId[]" },
            {
                name: "configs",
                type: "tuple[]",
                internalType: "struct ValidationManager.ValidationConfig[]",
                components: [
                    { name: "nonce", type: "uint32", internalType: "uint32" },
                    {
                        name: "hook",
                        type: "address",
                        internalType: "contract IHook"
                    }
                ]
            },
            {
                name: "validationData",
                type: "bytes[]",
                internalType: "bytes[]"
            },
            { name: "hookData", type: "bytes[]", internalType: "bytes[]" }
        ],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "invalidateNonce",
        inputs: [{ name: "nonce", type: "uint32", internalType: "uint32" }],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "isAllowedSelector",
        inputs: [
            { name: "vId", type: "bytes21", internalType: "ValidationId" },
            { name: "selector", type: "bytes4", internalType: "bytes4" }
        ],
        outputs: [{ name: "", type: "bool", internalType: "bool" }],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "isModuleInstalled",
        inputs: [
            { name: "moduleType", type: "uint256", internalType: "uint256" },
            { name: "module", type: "address", internalType: "address" },
            { name: "additionalContext", type: "bytes", internalType: "bytes" }
        ],
        outputs: [{ name: "", type: "bool", internalType: "bool" }],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "isValidSignature",
        inputs: [
            { name: "hash", type: "bytes32", internalType: "bytes32" },
            { name: "signature", type: "bytes", internalType: "bytes" }
        ],
        outputs: [{ name: "", type: "bytes4", internalType: "bytes4" }],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "permissionConfig",
        inputs: [{ name: "pId", type: "bytes4", internalType: "PermissionId" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                internalType: "struct ValidationManager.PermissionConfig",
                components: [
                    {
                        name: "permissionFlag",
                        type: "bytes2",
                        internalType: "PassFlag"
                    },
                    {
                        name: "signer",
                        type: "address",
                        internalType: "contract ISigner"
                    },
                    {
                        name: "policyData",
                        type: "bytes22[]",
                        internalType: "PolicyData[]"
                    }
                ]
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "rootValidator",
        inputs: [],
        outputs: [{ name: "", type: "bytes21", internalType: "ValidationId" }],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "selectorConfig",
        inputs: [{ name: "selector", type: "bytes4", internalType: "bytes4" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                internalType: "struct SelectorManager.SelectorConfig",
                components: [
                    {
                        name: "hook",
                        type: "address",
                        internalType: "contract IHook"
                    },
                    {
                        name: "target",
                        type: "address",
                        internalType: "address"
                    },
                    {
                        name: "callType",
                        type: "bytes1",
                        internalType: "CallType"
                    }
                ]
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "supportsExecutionMode",
        inputs: [{ name: "mode", type: "bytes32", internalType: "ExecMode" }],
        outputs: [{ name: "", type: "bool", internalType: "bool" }],
        stateMutability: "pure"
    },
    {
        type: "function",
        name: "supportsModule",
        inputs: [
            { name: "moduleTypeId", type: "uint256", internalType: "uint256" }
        ],
        outputs: [{ name: "", type: "bool", internalType: "bool" }],
        stateMutability: "pure"
    },
    {
        type: "function",
        name: "uninstallModule",
        inputs: [
            { name: "moduleType", type: "uint256", internalType: "uint256" },
            { name: "module", type: "address", internalType: "address" },
            { name: "deInitData", type: "bytes", internalType: "bytes" }
        ],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "uninstallValidation",
        inputs: [
            { name: "vId", type: "bytes21", internalType: "ValidationId" },
            { name: "deinitData", type: "bytes", internalType: "bytes" },
            { name: "hookDeinitData", type: "bytes", internalType: "bytes" }
        ],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "upgradeTo",
        inputs: [
            {
                name: "_newImplementation",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "validNonceFrom",
        inputs: [],
        outputs: [{ name: "", type: "uint32", internalType: "uint32" }],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "validateUserOp",
        inputs: [
            {
                name: "userOp",
                type: "tuple",
                internalType: "struct PackedUserOperation",
                components: [
                    {
                        name: "sender",
                        type: "address",
                        internalType: "address"
                    },
                    { name: "nonce", type: "uint256", internalType: "uint256" },
                    { name: "initCode", type: "bytes", internalType: "bytes" },
                    { name: "callData", type: "bytes", internalType: "bytes" },
                    {
                        name: "accountGasLimits",
                        type: "bytes32",
                        internalType: "bytes32"
                    },
                    {
                        name: "preVerificationGas",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "gasFees",
                        type: "bytes32",
                        internalType: "bytes32"
                    },
                    {
                        name: "paymasterAndData",
                        type: "bytes",
                        internalType: "bytes"
                    },
                    { name: "signature", type: "bytes", internalType: "bytes" }
                ]
            },
            { name: "userOpHash", type: "bytes32", internalType: "bytes32" },
            {
                name: "missingAccountFunds",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        outputs: [
            {
                name: "validationData",
                type: "uint256",
                internalType: "ValidationData"
            }
        ],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "validationConfig",
        inputs: [
            { name: "vId", type: "bytes21", internalType: "ValidationId" }
        ],
        outputs: [
            {
                name: "",
                type: "tuple",
                internalType: "struct ValidationManager.ValidationConfig",
                components: [
                    { name: "nonce", type: "uint32", internalType: "uint32" },
                    {
                        name: "hook",
                        type: "address",
                        internalType: "contract IHook"
                    }
                ]
            }
        ],
        stateMutability: "view"
    },
    {
        type: "event",
        name: "ModuleInstalled",
        inputs: [
            {
                name: "moduleTypeId",
                type: "uint256",
                indexed: false,
                internalType: "uint256"
            },
            {
                name: "module",
                type: "address",
                indexed: false,
                internalType: "address"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "ModuleUninstallResult",
        inputs: [
            {
                name: "module",
                type: "address",
                indexed: false,
                internalType: "address"
            },
            {
                name: "result",
                type: "bool",
                indexed: false,
                internalType: "bool"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "ModuleUninstalled",
        inputs: [
            {
                name: "moduleTypeId",
                type: "uint256",
                indexed: false,
                internalType: "uint256"
            },
            {
                name: "module",
                type: "address",
                indexed: false,
                internalType: "address"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "NonceInvalidated",
        inputs: [
            {
                name: "nonce",
                type: "uint32",
                indexed: false,
                internalType: "uint32"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "PermissionInstalled",
        inputs: [
            {
                name: "permission",
                type: "bytes4",
                indexed: false,
                internalType: "PermissionId"
            },
            {
                name: "nonce",
                type: "uint32",
                indexed: false,
                internalType: "uint32"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "PermissionUninstalled",
        inputs: [
            {
                name: "permission",
                type: "bytes4",
                indexed: false,
                internalType: "PermissionId"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "Received",
        inputs: [
            {
                name: "sender",
                type: "address",
                indexed: false,
                internalType: "address"
            },
            {
                name: "amount",
                type: "uint256",
                indexed: false,
                internalType: "uint256"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "RootValidatorUpdated",
        inputs: [
            {
                name: "rootValidator",
                type: "bytes21",
                indexed: false,
                internalType: "ValidationId"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "SelectorSet",
        inputs: [
            {
                name: "selector",
                type: "bytes4",
                indexed: false,
                internalType: "bytes4"
            },
            {
                name: "vId",
                type: "bytes21",
                indexed: false,
                internalType: "ValidationId"
            },
            {
                name: "allowed",
                type: "bool",
                indexed: false,
                internalType: "bool"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "TryExecuteUnsuccessful",
        inputs: [
            {
                name: "batchExecutionindex",
                type: "uint256",
                indexed: false,
                internalType: "uint256"
            },
            {
                name: "result",
                type: "bytes",
                indexed: false,
                internalType: "bytes"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "Upgraded",
        inputs: [
            {
                name: "implementation",
                type: "address",
                indexed: true,
                internalType: "address"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "ValidatorInstalled",
        inputs: [
            {
                name: "validator",
                type: "address",
                indexed: false,
                internalType: "contract IValidator"
            },
            {
                name: "nonce",
                type: "uint32",
                indexed: false,
                internalType: "uint32"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "ValidatorUninstalled",
        inputs: [
            {
                name: "validator",
                type: "address",
                indexed: false,
                internalType: "contract IValidator"
            }
        ],
        anonymous: false
    },
    { type: "error", name: "EnableNotApproved", inputs: [] },
    { type: "error", name: "ExecutionReverted", inputs: [] },
    { type: "error", name: "InvalidCallType", inputs: [] },
    { type: "error", name: "InvalidCaller", inputs: [] },
    { type: "error", name: "InvalidExecutor", inputs: [] },
    { type: "error", name: "InvalidFallback", inputs: [] },
    { type: "error", name: "InvalidMode", inputs: [] },
    { type: "error", name: "InvalidModuleType", inputs: [] },
    { type: "error", name: "InvalidNonce", inputs: [] },
    { type: "error", name: "InvalidSelector", inputs: [] },
    { type: "error", name: "InvalidSignature", inputs: [] },
    { type: "error", name: "InvalidValidationType", inputs: [] },
    { type: "error", name: "InvalidValidator", inputs: [] },
    { type: "error", name: "NonceInvalidationError", inputs: [] },
    { type: "error", name: "NotSupportedCallType", inputs: [] },
    { type: "error", name: "OnlyExecuteUserOp", inputs: [] },
    { type: "error", name: "PermissionDataLengthMismatch", inputs: [] },
    { type: "error", name: "PermissionNotAlllowedForSignature", inputs: [] },
    { type: "error", name: "PermissionNotAlllowedForUserOp", inputs: [] },
    { type: "error", name: "PolicyDataTooLarge", inputs: [] },
    {
        type: "error",
        name: "PolicyFailed",
        inputs: [{ name: "i", type: "uint256", internalType: "uint256" }]
    },
    { type: "error", name: "PolicySignatureOrderError", inputs: [] },
    { type: "error", name: "RootValidatorCannotBeRemoved", inputs: [] },
    { type: "error", name: "SignerPrefixNotPresent", inputs: [] }
] as const
