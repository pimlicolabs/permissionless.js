export const KernelV3FactoryAbi = [
    {
        type: "constructor",
        inputs: [{ name: "_impl", type: "address", internalType: "address" }],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "createAccount",
        inputs: [
            { name: "data", type: "bytes", internalType: "bytes" },
            { name: "salt", type: "bytes32", internalType: "bytes32" }
        ],
        outputs: [{ name: "", type: "address", internalType: "address" }],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "getAddress",
        inputs: [
            { name: "data", type: "bytes", internalType: "bytes" },
            { name: "salt", type: "bytes32", internalType: "bytes32" }
        ],
        outputs: [{ name: "", type: "address", internalType: "address" }],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "implementation",
        inputs: [],
        outputs: [{ name: "", type: "address", internalType: "address" }],
        stateMutability: "view"
    },
    { type: "error", name: "InitializeError", inputs: [] }
] as const
