export const SINGLETON_PAYMASTER_V07_ABI = [
    {
        type: "constructor",
        inputs: [
            {
                name: "_entryPoint",
                type: "address",
                internalType: "address"
            },
            {
                name: "_owner",
                type: "address",
                internalType: "address"
            },
            {
                name: "_signers",
                type: "address[]",
                internalType: "address[]"
            }
        ],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "addSigner",
        inputs: [
            {
                name: "_signer",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "addStake",
        inputs: [
            {
                name: "unstakeDelaySec",
                type: "uint32",
                internalType: "uint32"
            }
        ],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "deposit",
        inputs: [],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "entryPoint",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "address",
                internalType: "contract IEntryPoint"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getCostInToken",
        inputs: [
            {
                name: "_actualGasCost",
                type: "uint256",
                internalType: "uint256"
            },
            {
                name: "_postOpGas",
                type: "uint256",
                internalType: "uint256"
            },
            {
                name: "_actualUserOpFeePerGas",
                type: "uint256",
                internalType: "uint256"
            },
            {
                name: "_exchangeRate",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "pure"
    },
    {
        type: "function",
        name: "getDeposit",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getHash",
        inputs: [
            {
                name: "_mode",
                type: "uint8",
                internalType: "uint8"
            },
            {
                name: "_userOp",
                type: "tuple",
                internalType: "struct PackedUserOperation",
                components: [
                    {
                        name: "sender",
                        type: "address",
                        internalType: "address"
                    },
                    {
                        name: "nonce",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "initCode",
                        type: "bytes",
                        internalType: "bytes"
                    },
                    {
                        name: "callData",
                        type: "bytes",
                        internalType: "bytes"
                    },
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
                    {
                        name: "signature",
                        type: "bytes",
                        internalType: "bytes"
                    }
                ]
            }
        ],
        outputs: [
            {
                name: "",
                type: "bytes32",
                internalType: "bytes32"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "owner",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "address",
                internalType: "address"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "postOp",
        inputs: [
            {
                name: "mode",
                type: "uint8",
                internalType: "enum PostOpMode"
            },
            {
                name: "context",
                type: "bytes",
                internalType: "bytes"
            },
            {
                name: "actualGasCost",
                type: "uint256",
                internalType: "uint256"
            },
            {
                name: "actualUserOpFeePerGas",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "removeSigner",
        inputs: [
            {
                name: "_signer",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "renounceOwnership",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "setTreasury",
        inputs: [
            {
                name: "_treasury",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "signers",
        inputs: [
            {
                name: "account",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [
            {
                name: "isValidSigner",
                type: "bool",
                internalType: "bool"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "transferOwnership",
        inputs: [
            {
                name: "newOwner",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "treasury",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "address",
                internalType: "address"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "unlockStake",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "validatePaymasterUserOp",
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
                    {
                        name: "nonce",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "initCode",
                        type: "bytes",
                        internalType: "bytes"
                    },
                    {
                        name: "callData",
                        type: "bytes",
                        internalType: "bytes"
                    },
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
                    {
                        name: "signature",
                        type: "bytes",
                        internalType: "bytes"
                    }
                ]
            },
            {
                name: "userOpHash",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "maxCost",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        outputs: [
            {
                name: "context",
                type: "bytes",
                internalType: "bytes"
            },
            {
                name: "validationData",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "withdrawStake",
        inputs: [
            {
                name: "withdrawAddress",
                type: "address",
                internalType: "address payable"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "withdrawTo",
        inputs: [
            {
                name: "withdrawAddress",
                type: "address",
                internalType: "address payable"
            },
            {
                name: "amount",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "event",
        name: "OwnershipTransferred",
        inputs: [
            {
                name: "previousOwner",
                type: "address",
                indexed: true,
                internalType: "address"
            },
            {
                name: "newOwner",
                type: "address",
                indexed: true,
                internalType: "address"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "SignerAdded",
        inputs: [
            {
                name: "signer",
                type: "address",
                indexed: false,
                internalType: "address"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "SignerRemoved",
        inputs: [
            {
                name: "signer",
                type: "address",
                indexed: false,
                internalType: "address"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "TreasuryUpdated",
        inputs: [
            {
                name: "oldTreasury",
                type: "address",
                indexed: false,
                internalType: "address"
            },
            {
                name: "newTreasury",
                type: "address",
                indexed: false,
                internalType: "address"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "UserOperationSponsored",
        inputs: [
            {
                name: "userOpHash",
                type: "bytes32",
                indexed: true,
                internalType: "bytes32"
            },
            {
                name: "user",
                type: "address",
                indexed: true,
                internalType: "address"
            },
            {
                name: "paymasterMode",
                type: "uint8",
                indexed: false,
                internalType: "uint8"
            },
            {
                name: "token",
                type: "address",
                indexed: false,
                internalType: "address"
            },
            {
                name: "tokenAmountPaid",
                type: "uint256",
                indexed: false,
                internalType: "uint256"
            },
            {
                name: "exchangeRate",
                type: "uint256",
                indexed: false,
                internalType: "uint256"
            }
        ],
        anonymous: false
    },
    {
        type: "error",
        name: "ECDSAInvalidSignature",
        inputs: []
    },
    {
        type: "error",
        name: "ECDSAInvalidSignatureLength",
        inputs: [
            {
                name: "length",
                type: "uint256",
                internalType: "uint256"
            }
        ]
    },
    {
        type: "error",
        name: "ECDSAInvalidSignatureS",
        inputs: [
            {
                name: "s",
                type: "bytes32",
                internalType: "bytes32"
            }
        ]
    },
    {
        type: "error",
        name: "ExchangeRateInvalid",
        inputs: []
    },
    {
        type: "error",
        name: "OwnableInvalidOwner",
        inputs: [
            {
                name: "owner",
                type: "address",
                internalType: "address"
            }
        ]
    },
    {
        type: "error",
        name: "OwnableUnauthorizedAccount",
        inputs: [
            {
                name: "account",
                type: "address",
                internalType: "address"
            }
        ]
    },
    {
        type: "error",
        name: "PaymasterAndDataLengthInvalid",
        inputs: []
    },
    {
        type: "error",
        name: "PaymasterConfigLengthInvalid",
        inputs: []
    },
    {
        type: "error",
        name: "PaymasterModeInvalid",
        inputs: []
    },
    {
        type: "error",
        name: "PaymasterSignatureLengthInvalid",
        inputs: []
    },
    {
        type: "error",
        name: "PostOpTransferFromFailed",
        inputs: [
            {
                name: "msg",
                type: "string",
                internalType: "string"
            }
        ]
    },
    {
        type: "error",
        name: "TokenAddressInvalid",
        inputs: []
    }
] as const

export const SINGLETON_PAYMASTER_V06_ABI = [
    {
        inputs: [
            { internalType: "address", name: "_entryPoint", type: "address" },
            { internalType: "address", name: "_owner", type: "address" },
            { internalType: "address[]", name: "_signers", type: "address[]" }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
    },
    { inputs: [], name: "ECDSAInvalidSignature", type: "error" },
    {
        inputs: [{ internalType: "uint256", name: "length", type: "uint256" }],
        name: "ECDSAInvalidSignatureLength",
        type: "error"
    },
    {
        inputs: [{ internalType: "bytes32", name: "s", type: "bytes32" }],
        name: "ECDSAInvalidSignatureS",
        type: "error"
    },
    { inputs: [], name: "ExchangeRateInvalid", type: "error" },
    {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "OwnableInvalidOwner",
        type: "error"
    },
    {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "OwnableUnauthorizedAccount",
        type: "error"
    },
    { inputs: [], name: "PaymasterAndDataLengthInvalid", type: "error" },
    { inputs: [], name: "PaymasterConfigLengthInvalid", type: "error" },
    { inputs: [], name: "PaymasterModeInvalid", type: "error" },
    { inputs: [], name: "PaymasterSignatureLengthInvalid", type: "error" },
    {
        inputs: [{ internalType: "string", name: "msg", type: "string" }],
        name: "PostOpTransferFromFailed",
        type: "error"
    },
    { inputs: [], name: "TokenAddressInvalid", type: "error" },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address"
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address"
            }
        ],
        name: "OwnershipTransferred",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "signer",
                type: "address"
            }
        ],
        name: "SignerAdded",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "signer",
                type: "address"
            }
        ],
        name: "SignerRemoved",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "oldTreasury",
                type: "address"
            },
            {
                indexed: false,
                internalType: "address",
                name: "newTreasury",
                type: "address"
            }
        ],
        name: "TreasuryUpdated",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "bytes32",
                name: "userOpHash",
                type: "bytes32"
            },
            {
                indexed: true,
                internalType: "address",
                name: "user",
                type: "address"
            },
            {
                indexed: false,
                internalType: "uint8",
                name: "paymasterMode",
                type: "uint8"
            },
            {
                indexed: false,
                internalType: "address",
                name: "token",
                type: "address"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "tokenAmountPaid",
                type: "uint256"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "exchangeRate",
                type: "uint256"
            }
        ],
        name: "UserOperationSponsored",
        type: "event"
    },
    {
        inputs: [{ internalType: "address", name: "_signer", type: "address" }],
        name: "addSigner",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "uint32", name: "unstakeDelaySec", type: "uint32" }
        ],
        name: "addStake",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [],
        name: "deposit",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [],
        name: "entryPoint",
        outputs: [
            { internalType: "contract IEntryPoint", name: "", type: "address" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_actualGasCost",
                type: "uint256"
            },
            { internalType: "uint256", name: "_postOpGas", type: "uint256" },
            {
                internalType: "uint256",
                name: "_actualUserOpFeePerGas",
                type: "uint256"
            },
            { internalType: "uint256", name: "_exchangeRate", type: "uint256" }
        ],
        name: "getCostInToken",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "pure",
        type: "function"
    },
    {
        inputs: [],
        name: "getDeposit",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "uint8", name: "_mode", type: "uint8" },
            {
                components: [
                    {
                        internalType: "address",
                        name: "sender",
                        type: "address"
                    },
                    { internalType: "uint256", name: "nonce", type: "uint256" },
                    { internalType: "bytes", name: "initCode", type: "bytes" },
                    { internalType: "bytes", name: "callData", type: "bytes" },
                    {
                        internalType: "uint256",
                        name: "callGasLimit",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "verificationGasLimit",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "preVerificationGas",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "maxFeePerGas",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "maxPriorityFeePerGas",
                        type: "uint256"
                    },
                    {
                        internalType: "bytes",
                        name: "paymasterAndData",
                        type: "bytes"
                    },
                    { internalType: "bytes", name: "signature", type: "bytes" }
                ],
                internalType: "struct UserOperation",
                name: "_userOp",
                type: "tuple"
            }
        ],
        name: "getHash",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "enum PostOpMode", name: "mode", type: "uint8" },
            { internalType: "bytes", name: "context", type: "bytes" },
            { internalType: "uint256", name: "actualGasCost", type: "uint256" }
        ],
        name: "postOp",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "_signer", type: "address" }],
        name: "removeSigner",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "_treasury", type: "address" }
        ],
        name: "setTreasury",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "signers",
        outputs: [
            { internalType: "bool", name: "isValidSigner", type: "bool" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "newOwner", type: "address" }
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "treasury",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "unlockStake",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "address",
                        name: "sender",
                        type: "address"
                    },
                    { internalType: "uint256", name: "nonce", type: "uint256" },
                    { internalType: "bytes", name: "initCode", type: "bytes" },
                    { internalType: "bytes", name: "callData", type: "bytes" },
                    {
                        internalType: "uint256",
                        name: "callGasLimit",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "verificationGasLimit",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "preVerificationGas",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "maxFeePerGas",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "maxPriorityFeePerGas",
                        type: "uint256"
                    },
                    {
                        internalType: "bytes",
                        name: "paymasterAndData",
                        type: "bytes"
                    },
                    { internalType: "bytes", name: "signature", type: "bytes" }
                ],
                internalType: "struct UserOperation",
                name: "userOp",
                type: "tuple"
            },
            { internalType: "bytes32", name: "userOpHash", type: "bytes32" },
            { internalType: "uint256", name: "maxCost", type: "uint256" }
        ],
        name: "validatePaymasterUserOp",
        outputs: [
            { internalType: "bytes", name: "context", type: "bytes" },
            { internalType: "uint256", name: "validationData", type: "uint256" }
        ],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address payable",
                name: "withdrawAddress",
                type: "address"
            }
        ],
        name: "withdrawStake",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address payable",
                name: "withdrawAddress",
                type: "address"
            },
            { internalType: "uint256", name: "amount", type: "uint256" }
        ],
        name: "withdrawTo",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const
