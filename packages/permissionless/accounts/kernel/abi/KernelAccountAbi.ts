/**
 * The exeute abi, used to execute a transaction on the kernel smart account
 */
export const KernelExecuteAbi = [
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
    }
] as const

/**
 * The init abi, used to initialise kernel account
 */
export const KernelInitAbi = [
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
    }
] as const
