import {
    type Address,
    type Hex,
    bytesToBigInt,
    bytesToHex,
    bytesToNumber,
    decodeFunctionData,
    encodeFunctionData,
    encodePacked,
    getAddress,
    hexToBytes,
    size
} from "viem"

export const multiSendAbi = [
    {
        inputs: [
            {
                internalType: "bytes",
                name: "transactions",
                type: "bytes"
            }
        ],
        name: "multiSend",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    }
] as const

export type MultiSendTransaction = {
    to: Address
    data: Hex
    value: bigint
    operation: 0 | 1
}

// operation (1 byte) + to (20 bytes) + value (32 bytes) + data length (32 bytes)
const TRANSACTION_HEADER_SIZE = 85

const encodeInternalTransaction = (tx: MultiSendTransaction): string => {
    if (tx.data.length % 2 !== 0) {
        throw new Error(
            `Invalid call data "${tx.data}": hex string must have an even number of characters`
        )
    }

    const encoded = encodePacked(
        // uint8 = 1 byte for operation
        // address = 20 bytes for to address
        // uint256 = 32 bytes for value
        // uint256 = 32 bytes for data length
        // bytes = dynamic length for data
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [tx.operation, tx.to, tx.value, BigInt(size(tx.data)), tx.data]
    )
    return encoded.slice(2)
}

export const encodeMultiSend = (txs: MultiSendTransaction[]): Hex => {
    const data: Hex = `0x${txs
        .map((tx) => encodeInternalTransaction(tx))
        .join("")}`

    return encodeFunctionData({
        abi: multiSendAbi,
        functionName: "multiSend",
        args: [data]
    })
}

export const decodeMultiSend = (data: Hex): MultiSendTransaction[] => {
    const decoded = decodeFunctionData({
        abi: multiSendAbi,
        data
    })

    const packed = hexToBytes(decoded.args[0])
    const transactions: MultiSendTransaction[] = []

    let position = 0

    while (position < packed.length) {
        const headerEnd = position + TRANSACTION_HEADER_SIZE

        if (headerEnd > packed.length) {
            throw new Error(
                "Invalid MultiSend data: transaction header is out of bounds"
            )
        }

        const operation = packed[position]

        if (operation !== 0 && operation !== 1) {
            throw new Error(
                `Invalid MultiSend data: unknown operation ${operation}`
            )
        }

        const to = getAddress(
            bytesToHex(packed.subarray(position + 1, position + 21))
        )
        const value = bytesToBigInt(
            packed.subarray(position + 21, position + 53)
        )
        // bytesToNumber throws if the length is not a safe integer
        const innerDataLength = bytesToNumber(
            packed.subarray(position + 53, headerEnd)
        )
        const dataEnd = headerEnd + innerDataLength

        if (dataEnd > packed.length) {
            throw new Error(
                "Invalid MultiSend data: transaction data is out of bounds"
            )
        }

        transactions.push({
            to,
            value,
            data: bytesToHex(packed.subarray(headerEnd, dataEnd)),
            operation
        })

        position = dataEnd
    }

    return transactions
}
