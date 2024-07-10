//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CoinbaseSmartWalletFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a)
 */
export const CoinbaseSmartWalletFactoryAbi = [
    {
        type: "constructor",
        inputs: [
            {
                name: "implementation_",
                internalType: "address",
                type: "address"
            }
        ],
        stateMutability: "payable"
    },
    { type: "error", inputs: [], name: "OwnerRequired" },
    {
        type: "function",
        inputs: [
            { name: "owners", internalType: "bytes[]", type: "bytes[]" },
            { name: "nonce", internalType: "uint256", type: "uint256" }
        ],
        name: "createAccount",
        outputs: [
            {
                name: "account",
                internalType: "contract CoinbaseSmartWallet",
                type: "address"
            }
        ],
        stateMutability: "payable"
    },
    {
        type: "function",
        inputs: [
            { name: "owners", internalType: "bytes[]", type: "bytes[]" },
            { name: "nonce", internalType: "uint256", type: "uint256" }
        ],
        name: "getAddress",
        outputs: [{ name: "", internalType: "address", type: "address" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [],
        name: "implementation",
        outputs: [{ name: "", internalType: "address", type: "address" }],
        stateMutability: "view"
    },
    {
        type: "function",
        inputs: [],
        name: "initCodeHash",
        outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
        stateMutability: "view"
    }
] as const
