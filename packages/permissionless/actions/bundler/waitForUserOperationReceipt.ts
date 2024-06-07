import {
    type Account,
    BaseError,
    type Chain,
    type Client,
    type Hash,
    type Transport,
    stringify
} from "viem"
import { getAction } from "viem/utils"
import type { Prettify } from "../../types/"
import { observe } from "../../utils/observe"
import {
    type GetUserOperationReceiptReturnType,
    getUserOperationReceipt
} from "./getUserOperationReceipt"

export class WaitForUserOperationReceiptTimeoutError extends BaseError {
    override name = "WaitForUserOperationReceiptTimeoutError"
    constructor({ hash }: { hash: Hash }) {
        super(
            `Timed out while waiting for transaction with hash "${hash}" to be confirmed.`
        )
    }
}

export type WaitForUserOperationReceiptParameters = {
    /** The hash of the transaction. */
    hash: Hash
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
 *   hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
 * })
 */
export const waitForUserOperationReceipt = <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    bundlerClient: Client<TTransport, TChain, TAccount>,
    {
        hash,
        pollingInterval = bundlerClient.pollingInterval,
        timeout = bundlerClient.transport.timeout
    }: Prettify<WaitForUserOperationReceiptParameters>
): Promise<Prettify<GetUserOperationReceiptReturnType>> => {
    const observerId = stringify([
        "waitForUserOperationReceipt",
        bundlerClient.uid,
        hash
    ])

    let userOperationReceipt: GetUserOperationReceiptReturnType

    return new Promise((resolve, reject) => {
        const unobserve = observe(
            observerId,
            { resolve, reject },
            async (emit) => {
                let timeoutTimer: ReturnType<typeof setTimeout>

                const _removeInterval = setInterval(async () => {
                    const done = (fn: () => void) => {
                        clearInterval(_removeInterval)
                        fn()
                        unobserve()
                        if (timeout) clearTimeout(timeoutTimer)
                    }
                    try {
                        const _userOperationReceipt = await getAction(
                            bundlerClient,
                            getUserOperationReceipt,
                            "getUserOperationReceipt"
                        )({ hash })

                        if (_userOperationReceipt !== null) {
                            userOperationReceipt = _userOperationReceipt
                        }

                        if (userOperationReceipt) {
                            done(() => emit.resolve(userOperationReceipt))
                            return
                        }
                    } catch (err) {
                        done(() => emit.reject(err))
                        return
                    }
                }, pollingInterval)

                if (timeout) {
                    timeoutTimer = setTimeout(() => {
                        clearInterval(_removeInterval)
                        unobserve()
                        reject(
                            new WaitForUserOperationReceiptTimeoutError({
                                hash
                            })
                        )
                        clearTimeout(timeoutTimer)
                    }, timeout)
                }
            }
        )
    })
}
