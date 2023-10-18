import { BaseError, type Chain, type Hash, stringify } from "viem"
import { type BundlerClient } from "../../clients/bundler"
import { observe } from "../../utils/observe"
import { type GetUserOperationReceiptReturnType, getUserOperationReceipt } from "./getUserOperationReceipt"

export class WaitForUserOperationReceiptTimeoutError extends BaseError {
    override name = "WaitForUserOperationReceiptTimeoutError"
    constructor({ userOperationHash }: { userOperationHash: Hash }) {
        super(`Timed out while waiting for transaction with hash "${userOperationHash}" to be confirmed.`)
    }
}

export type WaitForUserOperationReceiptParameters = {
    /** The hash of the transaction. */
    userOperationHash: Hash
    /**
     * Polling frequency (in ms). Defaults to the client's pollingInterval config.
     * @default client.pollingInterval
     */
    pollingInterval?: number
    /** Optional timeout (in milliseconds) to wait before stopping polling. */
    timeout?: number
}

/**
 * Waits for the User Operation to be included on a [Block](https://viem.sh/docs/glossary/terms.html#block) (one confirmation), and then returns the [User Operation Receipt](https://docs.pimlico.io/permissionless/reference/bundler-actions/getUserOperationReceipt).
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/waitForUserOperationReceipt
 *
 * @param client - Bundler Client to use
 * @param parameters - {@link WaitForUserOperationReceiptParameters}
 * @returns The transaction receipt. {@link GetUserOperationReceiptReturnType}
 *
 * @example
 * import { createBundlerClient, waitForUserOperationReceipt, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const client = createBundlerClient({
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const userOperationReceipt = await waitForUserOperationReceipt(client, {
 *   userOperationHash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
 * })
 */
export const waitForUserOperationReceipt = <TChain extends Chain | undefined>(
    bundlerClient: BundlerClient<TChain>,
    {
        userOperationHash,
        pollingInterval = bundlerClient.pollingInterval,
        timeout
    }: WaitForUserOperationReceiptParameters
): Promise<GetUserOperationReceiptReturnType> => {
    const observerId = stringify(["waitForUserOperationReceipt", bundlerClient.uid, userOperationHash])

    let userOperationReceipt: GetUserOperationReceiptReturnType

    return new Promise((resolve, reject) => {
        if (timeout) {
            setTimeout(() => reject(new WaitForUserOperationReceiptTimeoutError({ userOperationHash })), timeout)
        }

        const _unobserve = observe(observerId, { resolve, reject }, async (emit) => {
            const _removeInterval = setInterval(async () => {
                const done = (fn: () => void) => {
                    clearInterval(_removeInterval)
                    fn()
                    _unobserve()
                }

                if (userOperationReceipt) {
                    done(() => emit.resolve(userOperationReceipt))
                    return
                }

                userOperationReceipt = await getUserOperationReceipt(bundlerClient, { userOperationHash })

                if (!userOperationReceipt) return
            }, pollingInterval)
        })
    })
}
