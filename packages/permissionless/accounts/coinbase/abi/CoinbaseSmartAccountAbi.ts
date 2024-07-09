export const CoinbaseSmartAccountAbi = [
    { type: "constructor", inputs: [], stateMutability: "nonpayable" },
    {
        type: "error",
        inputs: [{ name: "owner", internalType: "bytes", type: "bytes" }],
        name: "AlreadyOwner"
    },
    { type: "error", inputs: [], name: "Initialized" },
    {
        type: "error",
        inputs: [{ name: "owner", internalType: "bytes", type: "bytes" }],
        name: "InvalidEthereumAddressOwner"
    },
    {
        type: "error",
        inputs: [{ name: "key", internalType: "uint256", type: "uint256" }],
        name: "InvalidNonceKey"
    },
    {
        type: "error",
        inputs: [{ name: "owner", internalType: "bytes", type: "bytes" }],
        name: "InvalidOwnerBytesLength"
    },
    { type: "error", inputs: [], name: "LastOwner" },
    {
        type: "error",
        inputs: [{ name: "index", internalType: "uint256", type: "uint256" }],
        name: "NoOwnerAtIndex"
    },
    {
        type: "error",
        inputs: [
            {
                name: "ownersRemaining",
                internalType: "uint256",
                type: "uint256"
            }
        ],
        name: "NotLastOwner"
    },
    {
        type: "error",
        inputs: [{ name: "selector", internalType: "bytes4", type: "bytes4" }],
        name: "SelectorNotAllowed"
    },
    { type: "error", inputs: [], name: "Unauthorized" },
    { type: "error", inputs: [], name: "UnauthorizedCallContext" },
    { type: "error", inputs: [], name: "UpgradeFailed" },
    {
        type: "error",
        inputs: [
            { name: "index", internalType: "uint256", type: "uint256" },
            { name: "expectedOwner", internalType: "bytes", type: "bytes" },
            { name: "actualOwner", internalType: "bytes", type: "bytes" }
        ],
        name: "WrongOwnerAtIndex"
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "index",
                internalType: "uint256",
                type: "uint256",
                indexed: true
            },
            {
                name: "owner",
                internalType: "bytes",
                type: "bytes",
                indexed: false
            }
        ],
        name: "AddOwner"
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "index",
                internalType: "uint256",
                type: "uint256",
                indexed: true
            },
            {
                name: "owner",
                internalType: "bytes",
                type: "bytes",
                indexed: false
            }
        ],
        name: "RemoveOwner"
    },
    {
        type: "event",
        anonymous: false,
        inputs: [
            {
                name: "implementation",
                internalType: "address",
                type: "address",
                indexed: true
            }
        ],
        name: "Upgraded"
    },
    { type: "fallback", stateMutability: "payable" },
    {
        type: "function",
        inputs: [],
        name: "REPLAYABLE_NONCE_KEY",
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [{ name: "owner", internalType: "address", type: "address" }],
        name: "addOwnerAddress",
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        inputs: [
            { name: "x", internalType: "bytes32", type: "bytes32" },
            { name: "y", internalType: "bytes32", type: "bytes32" }
        ],
        name: "addOwnerPublicKey",
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        inputs: [
            { name: "functionSelector", internalType: "bytes4", type: "bytes4" }
        ],
        name: "canSkipChainIdValidation",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "pure"
    },
    {
        type: "function",
        inputs: [],
        name: "domainSeparator",
        outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [],
        name: "eip712Domain",
        outputs: [
            { name: "fields", internalType: "bytes1", type: "bytes1" },
            { name: "name", internalType: "string", type: "string" },
            { name: "version", internalType: "string", type: "string" },
            { name: "chainId", internalType: "uint256", type: "uint256" },
            {
                name: "verifyingContract",
                internalType: "address",
                type: "address"
            },
            { name: "salt", internalType: "bytes32", type: "bytes32" },
            { name: "extensions", internalType: "uint256[]", type: "uint256[]" }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [],
        name: "entryPoint",
        outputs: [{ name: "", internalType: "address", type: "address" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [
            { name: "target", internalType: "address", type: "address" },
            { name: "value", internalType: "uint256", type: "uint256" },
            { name: "data", internalType: "bytes", type: "bytes" }
        ],
        name: "execute",
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        inputs: [
            {
                name: "calls",
                internalType: "struct CoinbaseSmartWallet.Call[]",
                type: "tuple[]",
                components: [
                    {
                        name: "target",
                        internalType: "address",
                        type: "address"
                    },
                    { name: "value", internalType: "uint256", type: "uint256" },
                    { name: "data", internalType: "bytes", type: "bytes" }
                ]
            }
        ],
        name: "executeBatch",
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        inputs: [{ name: "calls", internalType: "bytes[]", type: "bytes[]" }],
        name: "executeWithoutChainIdValidation",
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        inputs: [
            {
                name: "userOp",
                internalType: "struct UserOperation",
                type: "tuple",
                components: [
                    {
                        name: "sender",
                        internalType: "address",
                        type: "address"
                    },
                    { name: "nonce", internalType: "uint256", type: "uint256" },
                    { name: "initCode", internalType: "bytes", type: "bytes" },
                    { name: "callData", internalType: "bytes", type: "bytes" },
                    {
                        name: "callGasLimit",
                        internalType: "uint256",
                        type: "uint256"
                    },
                    {
                        name: "verificationGasLimit",
                        internalType: "uint256",
                        type: "uint256"
                    },
                    {
                        name: "preVerificationGas",
                        internalType: "uint256",
                        type: "uint256"
                    },
                    {
                        name: "maxFeePerGas",
                        internalType: "uint256",
                        type: "uint256"
                    },
                    {
                        name: "maxPriorityFeePerGas",
                        internalType: "uint256",
                        type: "uint256"
                    },
                    {
                        name: "paymasterAndData",
                        internalType: "bytes",
                        type: "bytes"
                    },
                    { name: "signature", internalType: "bytes", type: "bytes" }
                ]
            }
        ],
        name: "getUserOpHashWithoutChainId",
        outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [],
        name: "implementation",
        outputs: [{ name: "$", internalType: "address", type: "address" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [{ name: "owners", internalType: "bytes[]", type: "bytes[]" }],
        name: "initialize",
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        inputs: [{ name: "account", internalType: "address", type: "address" }],
        name: "isOwnerAddress",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [{ name: "account", internalType: "bytes", type: "bytes" }],
        name: "isOwnerBytes",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [
            { name: "x", internalType: "bytes32", type: "bytes32" },
            { name: "y", internalType: "bytes32", type: "bytes32" }
        ],
        name: "isOwnerPublicKey",
        outputs: [{ name: "", internalType: "bool", type: "bool" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [
            { name: "hash", internalType: "bytes32", type: "bytes32" },
            { name: "signature", internalType: "bytes", type: "bytes" }
        ],
        name: "isValidSignature",
        outputs: [{ name: "result", internalType: "bytes4", type: "bytes4" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [],
        name: "nextOwnerIndex",
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [{ name: "index", internalType: "uint256", type: "uint256" }],
        name: "ownerAtIndex",
        outputs: [{ name: "", internalType: "bytes", type: "bytes" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [],
        name: "ownerCount",
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [],
        name: "proxiableUUID",
        outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [
            { name: "index", internalType: "uint256", type: "uint256" },
            { name: "owner", internalType: "bytes", type: "bytes" }
        ],
        name: "removeLastOwner",
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        inputs: [
            { name: "index", internalType: "uint256", type: "uint256" },
            { name: "owner", internalType: "bytes", type: "bytes" }
        ],
        name: "removeOwnerAtIndex",
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        inputs: [],
        name: "removedOwnersCount",
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [{ name: "hash", internalType: "bytes32", type: "bytes32" }],
        name: "replaySafeHash",
        outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [
            {
                name: "newImplementation",
                internalType: "address",
                type: "address"
            },
            { name: "data", internalType: "bytes", type: "bytes" }
        ],
        name: "upgradeToAndCall",
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        inputs: [
            {
                name: "userOp",
                internalType: "struct UserOperation",
                type: "tuple",
                components: [
                    {
                        name: "sender",
                        internalType: "address",
                        type: "address"
                    },
                    { name: "nonce", internalType: "uint256", type: "uint256" },
                    { name: "initCode", internalType: "bytes", type: "bytes" },
                    { name: "callData", internalType: "bytes", type: "bytes" },
                    {
                        name: "callGasLimit",
                        internalType: "uint256",
                        type: "uint256"
                    },
                    {
                        name: "verificationGasLimit",
                        internalType: "uint256",
                        type: "uint256"
                    },
                    {
                        name: "preVerificationGas",
                        internalType: "uint256",
                        type: "uint256"
                    },
                    {
                        name: "maxFeePerGas",
                        internalType: "uint256",
                        type: "uint256"
                    },
                    {
                        name: "maxPriorityFeePerGas",
                        internalType: "uint256",
                        type: "uint256"
                    },
                    {
                        name: "paymasterAndData",
                        internalType: "bytes",
                        type: "bytes"
                    },
                    { name: "signature", internalType: "bytes", type: "bytes" }
                ]
            },
            { name: "userOpHash", internalType: "bytes32", type: "bytes32" },
            {
                name: "missingAccountFunds",
                internalType: "uint256",
                type: "uint256"
            }
        ],
        name: "validateUserOp",
        outputs: [
            { name: "validationData", internalType: "uint256", type: "uint256" }
        ],
        stateMutability: "nonpayable"
    },
    { type: "receive", stateMutability: "payable" }
] as const
