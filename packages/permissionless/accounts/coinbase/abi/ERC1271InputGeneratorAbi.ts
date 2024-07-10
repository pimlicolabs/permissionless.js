export const ERC1271InputGeneratorAbi = [
    {
        type: "constructor",
        inputs: [
            {
                name: "account",
                internalType: "contract CoinbaseSmartWallet",
                type: "address"
            },
            { name: "hash", internalType: "bytes32", type: "bytes32" },
            {
                name: "accountFactory",
                internalType: "address",
                type: "address"
            },
            { name: "factoryCalldata", internalType: "bytes", type: "bytes" }
        ],
        stateMutability: "nonpayable"
    }
] as const
