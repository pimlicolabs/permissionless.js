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
    type RpcUserOperationReceipt,
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
     * Time (ms) from sending the user operation to having its receipt, covering
     * the bundler call and any receipt polling.
     * @default client.transport.timeout ?? 10_000
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
    /**
     * The bundle landed but reverted, so it didn't execute the user operation.
     * Another bundler may have included it first: check `getUserOperationReceipt` before resending.
     */
    | "bundle_reverted"
    /** May have been sent, but no receipt before `timeout`. Keep polling `getUserOperationReceipt`. */
    | "pending"
    /** The bundler couldn't send the bundle and no receipt showed up before `timeout`. */
    | "not_found"

export class SendUserOperationSyncError extends BaseError {
    readonly kind: SendUserOperationSyncErrorKind
    readonly userOperationHash: Hash
    /** Whether sending the same user operation again is safe. */
    readonly canResend: boolean

    constructor({
        cause,
        kind,
        message: message_,
        userOperationHash
    }: {
        cause?: BaseError | Error | undefined
        kind: SendUserOperationSyncErrorKind
        /** Overrides the default message, e.g. with the bundler's. */
        message?: string | undefined
        userOperationHash: Hash
    }) {
        const message = {
            rejected: "User operation was rejected by the bundler.",
            bundle_reverted:
                "Bundle transaction reverted onchain. The user operation was not executed.",
            pending:
                "User operation may have been sent but is not included yet. Poll `getUserOperationReceipt` instead of resending.",
            not_found:
                "Bundler couldn't send the user operation and no receipt was found."
        }[kind]
        super(message_ || message, {
            cause,
            metaMessages: [`User operation hash: ${userOperationHash}`],
            name: "SendUserOperationSyncError"
        })
        this.kind = kind
        this.userOperationHash = userOperationHash
        this.canResend = kind === "bundle_reverted" || kind === "not_found"
    }
}

const deadlineExceeded = Symbol("deadlineExceeded")

/**
 * Sends a user operation in its own bundle via `pimlico_sendUserOperationNow`
 * and returns its receipt, without waiting for the mempool.
 *
 * Never resends on its own. Sending and any receipt polling must finish within
 * `timeout` ms. Otherwise it throws a {@link SendUserOperationSyncError} whose
 * `kind` says what happened and whose `canResend` says whether sending the same
 * user operation again is safe.
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
        timeout = client.transport.timeout ?? 10_000,
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

    const deadline = Date.now() + timeout

    // Resolves to `deadlineExceeded` if `promise` hasn't settled by the deadline.
    const beforeDeadline = <T>(promise: Promise<T>) => {
        let timer: ReturnType<typeof setTimeout> | undefined
        return Promise.race([
            promise,
            new Promise<typeof deadlineExceeded>((resolve) => {
                timer = setTimeout(
                    () => resolve(deadlineExceeded),
                    Math.max(deadline - Date.now(), 0)
                )
            })
        ]).finally(() => clearTimeout(timer))
    }

    const waitForReceipt = async () => {
        while (Date.now() < deadline) {
            const receipt = await beforeDeadline(
                getAction(
                    client,
                    getUserOperationReceipt,
                    "getUserOperationReceipt"
                )({ hash: userOperationHash })
            ).catch(() => null)
            if (receipt === deadlineExceeded) return null
            if (receipt) return receipt
            await beforeDeadline(
                new Promise((resolve) => setTimeout(resolve, pollingInterval))
            )
        }
        return null
    }

    const response = await beforeDeadline(
        (
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
    ).catch((err: Error) => err)

    // No answer before the deadline: it may have been sent.
    if (response === deadlineExceeded) {
        throw new SendUserOperationSyncError({
            kind: "pending",
            userOperationHash
        })
    }
    if (!(response instanceof Error)) {
        return formatUserOperationReceipt(response as RpcUserOperationReceipt)
    }
    const error = response

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
            kind: "bundle_reverted",
            message: rpcError.details,
            userOperationHash
        })
    }

    if (rpcError && !data?.transactionHash && rpcError.code !== -32603) {
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

    // Sent but not included yet, internal error, or no answer at all:
    // poll until the deadline, never resend.
    const receipt = await waitForReceipt()
    if (receipt) return receipt
    throw new SendUserOperationSyncError({
        cause: error,
        // Only -32603 without a transaction hash means it wasn't sent.
        kind:
            rpcError?.code === -32603 && !data?.transactionHash
                ? "not_found"
                : "pending",
        userOperationHash
    })
}
