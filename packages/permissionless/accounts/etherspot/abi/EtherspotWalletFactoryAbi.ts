export const EtherspotWalletFactoryAbi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "_implementation",
                type: "address"
            }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "_salt",
                type: "bytes32"
            },
            {
                internalType: "bytes",
                name: "initCode",
                type: "bytes"
            }
        ],
        name: "_getSalt",
        outputs: [
            {
                internalType: "bytes32",
                name: "salt",
                type: "bytes32"
            }
        ],
        stateMutability: "pure",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "salt",
                type: "bytes32"
            },
            {
                internalType: "bytes",
                name: "initCode",
                type: "bytes"
            }
        ],
        name: "createAccount",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "payable",
        type: "function"
    },
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
    },
    {
        inputs: [],
        name: "implementation",
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
