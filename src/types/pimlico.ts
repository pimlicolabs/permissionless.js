import type { Account, Chain, Client, Hash, Hex, Transport } from "viem"
// import type { BundlerRpcSchema } from "./bundler"

export type PimlicoBundlerClient = Client<Transport, Chain | undefined, Account | undefined, PimlicoBundlerRpcSchema>

type PimlicoUserOperationGasPriceWithBigIntAsHex = {
    slow: {
        maxFeePerGas: Hex
        maxPriorityFeePerGas: Hex
    }
    standard: {
        maxFeePerGas: Hex
        maxPriorityFeePerGas: Hex
    }
    fast: {
        maxFeePerGas: Hex
        maxPriorityFeePerGas: Hex
    }
}

export type PimlicoUserOperationStatus = {
    status: "not_found" | "submitted" | "included"
    transactionHash: Hash | null
}

export type PimlicoUserOperationGasPrice = {
    slow: {
        maxFeePerGas: bigint
        maxPriorityFeePerGas: bigint
    }
    standard: {
        maxFeePerGas: bigint
        maxPriorityFeePerGas: bigint
    }
    fast: {
        maxFeePerGas: bigint
        maxPriorityFeePerGas: bigint
    }
}

export type PimlicoBundlerRpcSchema = [
    // ...BundlerRpcSchema,
    {
        Method: "pimlico_getUserOperationGasPrice"
        Parameters: []
        ReturnType: PimlicoUserOperationGasPriceWithBigIntAsHex
    },
    {
        Method: "pimlico_getUserOperationStatus"
        Parameters: [hash: Hash]
        ReturnType: PimlicoUserOperationStatus
    }
]
