import {
    BaseError,
    type Chain,
    type Client,
    type Hash,
    RpcRequestError,
    type Transport
} from "viem"
import {
    type PrepareUserOperationParameters,
    type SendUserOperationParameters,
    type SmartAccount,
    type UserOperation,
    type UserOperationReceipt,
    formatUserOperationReceipt,
    formatUserOperationRequest,
    getUserOperationError,
    getUserOperationHash,
    getUserOperationReceipt,
    prepareUserOperation
} from "viem/account-abstraction"
import { getChainId } from "viem/actions"
import { getAction, parseAccount } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"

export type SendUserOperationSyncParameters<
    account extends SmartAccount | undefined = SmartAccount | undefined,
    accountOverride extends SmartAccount | undefined = SmartAccount | undefined,
    calls extends readonly unknown[] = readonly unknown[]
> = SendUserOperationParameters<account, accountOverride, calls> & {
    /**
     * How long (ms) to poll for the receipt when the bundler's response doesn't
     * say whether the user operation was included.
     * @default 10_000
     */
    timeout?: number | undefined
    /**
     * Polling interval (ms) used while waiting for the receipt.
     * @default client.pollingInterval
     */
    pollingInterval?: number | undefined
}

export type SendUserOperationSyncReturnType = UserOperationReceipt

export type SendUserOperationSyncErrorKind =
    /** Rejected before sending (invalid fields, gas limits, simulation). Nothing was sent. */
    | "rejected"
    /** The bundle landed but reverted. The user operation didn't execute and its nonce is unused. */
    | "reverted"
    /** Sent, but not included before `timeout`. Keep polling `getUserOperationReceipt`. */
    | "pending"
    /** No receipt before `timeout`, and the bundler never confirmed it was sent. */
    | "not_found"

export class SendUserOperationSyncError extends BaseError {
    readonly kind: SendUserOperationSyncErrorKind
    readonly userOperationHash: Hash
    /** Whether sending the same user operation again is safe. */
    readonly canResend: boolean

    constructor({
        cause,
        kind,
        userOperationHash
    }: {
        cause?: BaseError | Error | undefined
        kind: SendUserOperationSyncErrorKind
        userOperationHash: Hash
    }) {
        const message = {
            rejected: "User operation was rejected by the bundler.",
            reverted:
                "Bundle transaction reverted onchain. The user operation was not executed.",
            pending:
                "User operation was sent but is not included yet. Poll `getUserOperationReceipt` instead of resending.",
            not_found:
                "User operation receipt not found and the bundler didn't confirm it was sent."
        }[kind]
        super(message, {
            cause,
            metaMessages: [`User operation hash: ${userOperationHash}`],
            name: "SendUserOperationSyncError"
        })
        this.kind = kind
        this.userOperationHash = userOperationHash
        this.canResend = kind === "reverted" || kind === "not_found"
    }
}

/**
 * Sends a user operation in its own bundle via `pimlico_sendUserOperationNow`
 * and returns its receipt, without waiting for the mempool.
 *
 * Never resends on its own. If the outcome is unclear (timeout, internal error),
 * it polls for the receipt for up to `timeout` ms. Otherwise it throws a
 * {@link SendUserOperationSyncError} whose `kind` says what happened and whose
 * `canResend` says whether sending the same user operation again is safe.
 *
 * The returned receipt can have `success: false` if the call reverted inside
 * the account; its nonce is then used.
 *
 * - Docs: https://docs.pimlico.io/references/bundler/endpoints/pimlico_sendUserOperationNow
 *
 * @param client - Client to use
 * @param parameters - {@link SendUserOperationSyncParameters}
 * @returns The user operation receipt. {@link SendUserOperationSyncReturnType}
 *
 * @example
 * import { sendUserOperationSync } from "permissionless/actions/pimlico"
 *
 * const receipt = await sendUserOperationSync(smartAccountClient, {
 *     calls: [{ to: "0x...", value: 0n, data: "0x" }]
 * })
 */
export async function sendUserOperationSync<
    const calls extends readonly unknown[],
    account extends SmartAccount | undefined,
    accountOverride extends SmartAccount | undefined = undefined
>(
    client: Client<Transport, Chain | undefined, account>,
    parameters: SendUserOperationSyncParameters<account, accountOverride, calls>
): Promise<SendUserOperationSyncReturnType> {
    const {
        account: account_ = client.account,
        timeout = 10_000,
        pollingInterval = client.pollingInterval,
        ...rest
    } = parameters

    if (!account_) throw new AccountNotFoundError()
    const account = parseAccount(account_) as SmartAccount
    const entryPointAddress =
        parameters.entryPointAddress ?? account.entryPoint.address

    const request = await getAction(
        client,
        prepareUserOperation,
        "prepareUserOperation"
    )({ ...rest, account } as unknown as PrepareUserOperationParameters)

    const userOperation = {
        ...request,
        signature:
            parameters.signature ||
            (await account.signUserOperation(request as UserOperation))
    } as UserOperation

    const userOperationHash = getUserOperationHash({
        chainId:
            client.chain?.id ??
            (await getAction(client, getChainId, "getChainId")({})),
        entryPointAddress,
        entryPointVersion: account.entryPoint.version,
        userOperation
    })

    const waitForReceipt = async () => {
        const deadline = Date.now() + timeout
        while (Date.now() < deadline) {
            try {
                return await getAction(
                    client,
                    getUserOperationReceipt,
                    "getUserOperationReceipt"
                )({ hash: userOperationHash })
            } catch {}
            await new Promise((resolve) => setTimeout(resolve, pollingInterval))
        }
        return null
    }

    try {
        const receipt = await (
            client as Client<
                Transport,
                Chain | undefined,
                account,
                PimlicoRpcSchema
            >
        ).request(
            {
                method: "pimlico_sendUserOperationNow",
                params: [
                    formatUserOperationRequest(userOperation),
                    entryPointAddress
                ]
            },
            { retryCount: 0 }
        )
        return formatUserOperationReceipt(receipt)
    } catch (err) {
        const error = err as Error
        const rpcError =
            error instanceof BaseError
                ? (error.walk(
                      (e) => e instanceof RpcRequestError
                  ) as RpcRequestError | null)
                : null
        const data = rpcError?.data as { transactionHash?: Hash } | undefined

        if (rpcError?.code === -32521) {
            throw new SendUserOperationSyncError({
                cause: error,
                kind: "reverted",
                userOperationHash
            })
        }

        // Sent but not included before the bundler's deadline: wait, don't resend.
        if (data?.transactionHash) {
            const receipt = await waitForReceipt()
            if (receipt) return receipt
            throw new SendUserOperationSyncError({
                cause: error,
                kind: "pending",
                userOperationHash
            })
        }

        if (rpcError && rpcError.code !== -32603) {
            const calls = (parameters as { calls?: unknown }).calls
            throw new SendUserOperationSyncError({
                cause: getUserOperationError(
                    error as BaseError,
                    {
                        ...userOperation,
                        ...(calls ? { calls } : {})
                    } as never
                ),
                kind: "rejected",
                userOperationHash
            })
        }

        // Internal error or no answer at all: it may have been sent.
        const receipt = await waitForReceipt()
        if (receipt) return receipt
        throw new SendUserOperationSyncError({
            cause: error,
            kind: "not_found",
            userOperationHash
        })
    }
}
