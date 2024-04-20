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
