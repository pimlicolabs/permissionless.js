export const EtherspotBootstrapAbi = [
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "address",
                        name: "module",
                        type: "address"
                    },
                    {
                        internalType: "bytes",
                        name: "data",
                        type: "bytes"
                    }
                ],
                internalType: "struct BootstrapConfig[]",
                name: "$valdiators",
                type: "tuple[]"
            },
            {
                components: [
                    {
                        internalType: "address",
                        name: "module",
                        type: "address"
                    },
                    {
                        internalType: "bytes",
                        name: "data",
                        type: "bytes"
                    }
                ],
                internalType: "struct BootstrapConfig[]",
                name: "$executors",
                type: "tuple[]"
            },
            {
                components: [
                    {
                        internalType: "address",
                        name: "module",
                        type: "address"
                    },
                    {
                        internalType: "bytes",
                        name: "data",
                        type: "bytes"
                    }
                ],
                internalType: "struct BootstrapConfig",
                name: "_hook",
                type: "tuple"
            },
            {
                components: [
                    {
                        internalType: "address",
                        name: "module",
                        type: "address"
                    },
                    {
                        internalType: "bytes",
                        name: "data",
                        type: "bytes"
                    }
                ],
                internalType: "struct BootstrapConfig[]",
                name: "_fallbacks",
                type: "tuple[]"
            }
        ],
        name: "initMSA",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
]

export const EtherspotOnInstallAbi = [
    {
        inputs: [
            {
                internalType: "bytes",
                name: "data",
                type: "bytes"
            }
        ],
        name: "onInstall",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const
