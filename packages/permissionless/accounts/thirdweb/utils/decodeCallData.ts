import { type Address, decodeFunctionData, type Hex } from "viem"

export const decodeCallData = async (callData: Hex) => {
    try {
        const decodedBatch = decodeFunctionData({
            abi: [
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
                    name: "executeBatch",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function"
                }
            ],
            data: callData
        })

        const calls: {
            to: Address
            data: Hex
            value?: bigint
        }[] = []

        for (let i = 0; i < decodedBatch.args[0].length; i++) {
            const to = decodedBatch.args[0][i]
            const value = decodedBatch.args[1][i]
            const data = decodedBatch.args[2][i]

            if (to === undefined || data === undefined) {
                throw new Error("Invalid batch call data")
            }

            calls.push({ to, value, data })
        }

        return calls
    } catch {}

    const decodedSingle = decodeFunctionData({
        abi: [
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
                name: "execute",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        data: callData
    })

    return [
        {
            to: decodedSingle.args[0],
            value: decodedSingle.args[1],
            data: decodedSingle.args[2]
        }
    ]
}
