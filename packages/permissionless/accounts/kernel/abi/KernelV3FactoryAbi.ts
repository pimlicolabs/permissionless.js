export const KernelV3FactoryAbi = [
    {
        type: "function",
        name: "createAccount",
        inputs: [
            { name: "data", type: "bytes", internalType: "bytes" },
            { name: "salt", type: "bytes32", internalType: "bytes32" }
        ],
        outputs: [{ name: "", type: "address", internalType: "address" }],
        stateMutability: "payable"
    }
] as const
