import type {
    Account,
    Address,
    Chain,
    Client,
    Hash,
    Hex,
    Log,
    Transport
} from "viem"
import type { BundlerClient } from "../../clients/createBundlerClient"
import type { Prettify } from "../../types"
import type { BundlerRpcSchema } from "../../types/bundler"
import type { EntryPoint } from "../../types/entrypoint"
import type { TStatus } from "../../types/userOperation"
import { transactionReceiptStatus } from "../../utils/deepHexlify"

export type GetUserOperationReceiptParameters = {
    hash: Hash
}

export type GetUserOperationReceiptReturnType = {
    userOpHash: Hash
    entryPoint: Address
    sender: Address
    nonce: bigint
    paymaster?: Address
    actualGasUsed: bigint
    actualGasCost: bigint
    success: boolean
    reason?: string
    receipt: {
        transactionHash: Hex
        transactionIndex: bigint
        blockHash: Hash
        blockNumber: bigint
        from: Address
        to: Address | null
        cumulativeGasUsed: bigint
        status: TStatus
        gasUsed: bigint
        contractAddress: Address | null
        logsBloom: Hex
        effectiveGasPrice: bigint
    }
    logs: Log[]
}

/**
 * Returns the user operation receipt from userOpHash
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/getUserOperationReceipt
 *
 * @param client {@link BundlerClient} that you created using viem's createClient and extended it with bundlerActions.
 * @param args {@link GetUserOperationReceiptParameters} UserOpHash that was returned by {@link sendUserOperation}
 * @returns user operation receipt {@link GetUserOperationReceiptReturnType} if found or null
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { getUserOperationReceipt } from "permissionless/actions"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http(BUNDLER_URL)
 * })
 *
 * getUserOperationReceipt(bundlerClient, {hash: userOpHash})
 *
 */
export const getUserOperationReceipt = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, BundlerRpcSchema<entryPoint>>,
    { hash }: Prettify<GetUserOperationReceiptParameters>
): Promise<Prettify<GetUserOperationReceiptReturnType> | null> => {
    const params: [Hash] = [hash]

    const response = await client.request({
        method: "eth_getUserOperationReceipt",
        params
    })

    if (!response) return null

    const userOperationReceipt: GetUserOperationReceiptReturnType = {
        userOpHash: response.userOpHash,
        entryPoint: response.entryPoint,
        sender: response.sender,
        nonce: BigInt(response.nonce),
        paymaster: response.paymaster,
        actualGasUsed: BigInt(response.actualGasUsed),
        actualGasCost: BigInt(response.actualGasCost),
        success: response.success,
        reason: response.reason,
        receipt: {
            transactionHash: response.receipt.transactionHash,
            transactionIndex: BigInt(response.receipt.transactionIndex),
            blockHash: response.receipt.blockHash,
            blockNumber: BigInt(response.receipt.blockNumber),
            from: response.receipt.from,
            to: response.receipt.to,
            cumulativeGasUsed: BigInt(response.receipt.cumulativeGasUsed),
            status: transactionReceiptStatus[response.receipt.status],
            gasUsed: BigInt(response.receipt.gasUsed),
            contractAddress: response.receipt.contractAddress,
            logsBloom: response.receipt.logsBloom,
            effectiveGasPrice: BigInt(response.receipt.effectiveGasPrice)
        },
        logs: response.logs.map((log) => ({
            data: log.data,
            blockNumber: BigInt(log.blockNumber),
            blockHash: log.blockHash,
            transactionHash: log.transactionHash,
            logIndex: Number(log.logIndex),
            transactionIndex: Number(log.transactionIndex),
            address: log.address,
            topics: log.topics,
            removed: log.removed
        }))
    }

    return userOperationReceipt
}
