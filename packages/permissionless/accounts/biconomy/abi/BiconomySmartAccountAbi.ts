/**
 * The exeuctor abi, used to execute transactions on the Biconomy Modular Smart Account
 */
export const BiconomyExecuteAbi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "dest",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "value",
                type: "uint256"
            },
            {
                internalType: "bytes",
                name: "func",
                type: "bytes"
            }
        ],
        name: "execute_ncC",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address[]",
                name: "dest",
                type: "address[]"
            },
            {
                internalType: "uint256[]",
                name: "value",
                type: "uint256[]"
            },
            {
                internalType: "bytes[]",
                name: "func",
                type: "bytes[]"
            }
        ],
        name: "executeBatch_y6U",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const

/**
 * The init abi, used to initialise Biconomy Modular Smart Account / setup default ECDSA module
 */
export const BiconomyInitAbi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "handler",
                type: "address"
            },
            {
                internalType: "address",
                name: "moduleSetupContract",
                type: "address"
            },
            {
                internalType: "bytes",
                name: "moduleSetupData",
                type: "bytes"
            }
        ],
        name: "init",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "eoaOwner",
                type: "address"
            }
        ],
        name: "initForSmartAccount",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "nonpayable",
        type: "function"
    }
]
