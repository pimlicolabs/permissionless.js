export const EtherspotWalletFactoryAbi = [
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "salt",
                type: "bytes32"
            },
            {
                internalType: "bytes",
                name: "initcode",
                type: "bytes"
            }
        ],
        name: "getAddress",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "view",
        type: "function"
    }
] as const
