export const KernelAccountAbi = [
    {
        inputs: [
            {
                internalType: "contract IEntryPoint",
                name: "_entryPoint",
                type: "address"
            }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
    },
    {
        inputs: [],
        name: "AlreadyInitialized",
        type: "error"
    },
    {
        inputs: [],
        name: "DisabledMode",
        type: "error"
    },
    {
        inputs: [],
        name: "NotAuthorizedCaller",
        type: "error"
    },
    {
        inputs: [],
        name: "NotEntryPoint",
        type: "error"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "oldValidator",
                type: "address"
            },
            {
                indexed: true,
                internalType: "address",
                name: "newValidator",
                type: "address"
            }
        ],
        name: "DefaultValidatorChanged",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "bytes4",
                name: "selector",
                type: "bytes4"
            },
            {
                indexed: true,
                internalType: "address",
                name: "executor",
                type: "address"
            },
            {
                indexed: true,
                internalType: "address",
                name: "validator",
                type: "address"
            }
        ],
        name: "ExecutionChanged",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "sender",
                type: "address"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256"
            }
        ],
        name: "Received",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "newImplementation",
                type: "address"
            }
        ],
        name: "Upgraded",
        type: "event"
    },
    {
        stateMutability: "payable",
        type: "fallback"
    },
    {
        inputs: [
            {
                internalType: "bytes4",
                name: "_disableFlag",
                type: "bytes4"
            }
        ],
        name: "disableMode",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [],
        name: "eip712Domain",
        outputs: [
            {
                internalType: "bytes1",
                name: "fields",
                type: "bytes1"
            },
            {
                internalType: "string",
                name: "name",
                type: "string"
            },
            {
                internalType: "string",
                name: "version",
                type: "string"
            },
            {
                internalType: "uint256",
                name: "chainId",
                type: "uint256"
            },
            {
                internalType: "address",
                name: "verifyingContract",
                type: "address"
            },
            {
                internalType: "bytes32",
                name: "salt",
                type: "bytes32"
            },
            {
                internalType: "uint256[]",
                name: "extensions",
                type: "uint256[]"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "entryPoint",
        outputs: [
            {
                internalType: "contract IEntryPoint",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
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
                internalType: "enum Operation",
                name: "",
                type: "uint8"
            }
        ],
        name: "execute",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [
            {
                components: [
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
                    }
                ],
                internalType: "struct Call[]",
                name: "calls",
                type: "tuple[]"
            }
        ],
        name: "executeBatch",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [],
        name: "getDefaultValidator",
        outputs: [
            {
                internalType: "contract IKernelValidator",
                name: "validator",
                type: "address"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getDisabledMode",
        outputs: [
            {
                internalType: "bytes4",
                name: "disabled",
                type: "bytes4"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "bytes4",
                name: "_selector",
                type: "bytes4"
            }
        ],
        name: "getExecution",
        outputs: [
            {
                components: [
                    {
                        internalType: "ValidAfter",
                        name: "validAfter",
                        type: "uint48"
                    },
                    {
                        internalType: "ValidUntil",
                        name: "validUntil",
                        type: "uint48"
                    },
                    {
                        internalType: "address",
                        name: "executor",
                        type: "address"
                    },
                    {
                        internalType: "contract IKernelValidator",
                        name: "validator",
                        type: "address"
                    }
                ],
                internalType: "struct ExecutionDetail",
                name: "",
                type: "tuple"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getLastDisabledTime",
        outputs: [
            {
                internalType: "uint48",
                name: "",
                type: "uint48"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint192",
                name: "key",
                type: "uint192"
            }
        ],
        name: "getNonce",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getNonce",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "contract IKernelValidator",
                name: "_defaultValidator",
                type: "address"
            },
            {
                internalType: "bytes",
                name: "_data",
                type: "bytes"
            }
        ],
        name: "initialize",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "hash",
                type: "bytes32"
            },
            {
                internalType: "bytes",
                name: "signature",
                type: "bytes"
            }
        ],
        name: "isValidSignature",
        outputs: [
            {
                internalType: "bytes4",
                name: "",
                type: "bytes4"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "name",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            },
            {
                internalType: "address",
                name: "",
                type: "address"
            },
            {
                internalType: "uint256[]",
                name: "",
                type: "uint256[]"
            },
            {
                internalType: "uint256[]",
                name: "",
                type: "uint256[]"
            },
            {
                internalType: "bytes",
                name: "",
                type: "bytes"
            }
        ],
        name: "onERC1155BatchReceived",
        outputs: [
            {
                internalType: "bytes4",
                name: "",
                type: "bytes4"
            }
        ],
        stateMutability: "pure",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            },
            {
                internalType: "address",
                name: "",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            },
            {
                internalType: "bytes",
                name: "",
                type: "bytes"
            }
        ],
        name: "onERC1155Received",
        outputs: [
            {
                internalType: "bytes4",
                name: "",
                type: "bytes4"
            }
        ],
        stateMutability: "pure",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            },
            {
                internalType: "address",
                name: "",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            },
            {
                internalType: "bytes",
                name: "",
                type: "bytes"
            }
        ],
        name: "onERC721Received",
        outputs: [
            {
                internalType: "bytes4",
                name: "",
                type: "bytes4"
            }
        ],
        stateMutability: "pure",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "contract IKernelValidator",
                name: "_defaultValidator",
                type: "address"
            },
            {
                internalType: "bytes",
                name: "_data",
                type: "bytes"
            }
        ],
        name: "setDefaultValidator",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "bytes4",
                name: "_selector",
                type: "bytes4"
            },
            {
                internalType: "address",
                name: "_executor",
                type: "address"
            },
            {
                internalType: "contract IKernelValidator",
                name: "_validator",
                type: "address"
            },
            {
                internalType: "ValidUntil",
                name: "_validUntil",
                type: "uint48"
            },
            {
                internalType: "ValidAfter",
                name: "_validAfter",
                type: "uint48"
            },
            {
                internalType: "bytes",
                name: "_enableData",
                type: "bytes"
            }
        ],
        name: "setExecution",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_newImplementation",
                type: "address"
            }
        ],
        name: "upgradeTo",
        outputs: [],
        stateMutability: "payable",
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
                    {
                        internalType: "uint256",
                        name: "nonce",
                        type: "uint256"
                    },
                    {
                        internalType: "bytes",
                        name: "initCode",
                        type: "bytes"
                    },
                    {
                        internalType: "bytes",
                        name: "callData",
                        type: "bytes"
                    },
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
                    {
                        internalType: "bytes",
                        name: "signature",
                        type: "bytes"
                    }
                ],
                internalType: "struct UserOperation",
                name: "_userOp",
                type: "tuple"
            },
            {
                internalType: "bytes32",
                name: "userOpHash",
                type: "bytes32"
            },
            {
                internalType: "uint256",
                name: "missingAccountFunds",
                type: "uint256"
            }
        ],
        name: "validateUserOp",
        outputs: [
            {
                internalType: "ValidationData",
                name: "validationData",
                type: "uint256"
            }
        ],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [],
        name: "version",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        stateMutability: "payable",
        type: "receive"
    }
] as const
