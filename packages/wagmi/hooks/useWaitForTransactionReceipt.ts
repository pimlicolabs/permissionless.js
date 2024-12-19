"use client"

import type {
    DefaultError,
    QueryKey,
    QueryOptions
} from "@tanstack/react-query"
import {
    type Config,
    type ResolvedRegister,
    type WaitForTransactionReceiptErrorType,
    type WaitForTransactionReceiptReturnType,
    getConnectorClient,
    waitForTransactionReceipt
} from "@wagmi/core"
import { ConnectorNotConnectedError } from "@wagmi/core"
import type {
    GetCallsStatusData,
    GetCallsStatusErrorType,
    GetCallsStatusOptions,
    GetCallsStatusQueryFnData
} from "@wagmi/core/experimental"
import type { WaitForTransactionReceiptData } from "@wagmi/core/query"
import {
    type Hash,
    type Prettify,
    WaitForTransactionReceiptTimeoutError,
    type WalletCapabilities,
    type WalletSendCallsParameters,
    isHash,
    stringify
} from "viem"
import { getTransactionReceipt, watchBlockNumber } from "viem/actions"
import {
    type GetCallsStatusReturnType,
    type ShowCallsStatusErrorType,
    getCallsStatus
} from "viem/experimental"
import { getAction } from "viem/utils"
import { useChainId, useConfig } from "wagmi"
import {
    type UseQueryParameters,
    type UseQueryReturnType,
    type WaitForTransactionReceiptOptions,
    type WaitForTransactionReceiptQueryFnData,
    useQuery
} from "wagmi/query"
import { observe } from "../utils/observe"
import { useAvailableCapabilities } from "./useAvailableCapabilities"
import type { ConfigParameter } from "./useSendTransaction"

export type WaitForTransactionReceiptQueryKey<
    config extends Config,
    chainId extends config["chains"][number]["id"]
> = ReturnType<typeof waitForTransactionReceiptQueryKey<config, chainId>>

export function waitForTransactionReceiptQueryKey<
    config extends Config,
    chainId extends config["chains"][number]["id"]
>(
    options: Omit<
        WaitForTransactionReceiptOptions<config, chainId>,
        "hash" | "onReplaced"
    > & {
        id?: string
        capabilities?: WalletSendCallsParameters<WalletCapabilities>[number]["capabilities"]
    } = {}
) {
    const { ...rest } = options
    return ["waitForTransactionReceipt", filterQueryOptions(rest)] as const
}

export function filterQueryOptions<type extends Record<string, unknown>>(
    options: type
): type {
    // destructuring is super fast
    // biome-ignore format: no formatting
    const {
      // import('@tanstack/query-core').QueryOptions
      _defaulted, behavior, gcTime, initialData, initialDataUpdatedAt, maxPages, meta, networkMode, queryFn, queryHash, queryKey, queryKeyHashFn, retry, retryDelay, structuralSharing,
  
      // import('@tanstack/query-core').InfiniteQueryObserverOptions
      getPreviousPageParam, getNextPageParam, initialPageParam,
      
      // import('@tanstack/react-query').UseQueryOptions
      _optimisticResults, enabled, notifyOnChangeProps, placeholderData, refetchInterval, refetchIntervalInBackground, refetchOnMount, refetchOnReconnect, refetchOnWindowFocus, retryOnMount, select, staleTime, suspense, throwOnError,
  
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // wagmi
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      config, connector, query,
      ...rest
    } = options

    return rest as type
}

export type QueryParameter<
    queryFnData = unknown,
    error = DefaultError,
    data = queryFnData,
    queryKey extends QueryKey = QueryKey
> = {
    query?:
        | Omit<
              UseQueryParameters<queryFnData, error, data, queryKey>,
              | "queryFn"
              | "queryHash"
              | "queryKey"
              | "queryKeyHashFn"
              | "throwOnError"
          >
        | undefined
}

export type UseCallsStatusParameters<
    config extends Config = Config,
    chainId extends
        config["chains"][number]["id"] = config["chains"][number]["id"],
    selectData = GetCallsStatusData
> = Prettify<
    Partial<GetCallsStatusOptions> &
        ConfigParameter<config> &
        QueryParameter<
            GetCallsStatusQueryFnData,
            GetCallsStatusErrorType,
            selectData,
            ReturnType<typeof getCallsStatusQueryKey>
        > & {
            chainId?:
                | (chainId extends config["chains"][number]["id"]
                      ? chainId
                      : undefined)
                | config["chains"][number]["id"]
                | undefined
        }
>

export function getCallsStatusQueryKey(
    options: Partial<GetCallsStatusOptions>
) {
    return ["callsStatus", filterQueryOptions(options)] as const
}

export async function waitForCallsStatus<
    config extends Config,
    chainId extends
        config["chains"][number]["id"] = config["chains"][number]["id"]
>(
    config: config,
    parameters: Omit<
        WaitForTransactionReceiptOptions<config, chainId>,
        "hash" | "onReplaced"
    > & {
        id: string
    }
): Promise<WaitForTransactionReceiptReturnType<config, chainId>> {
    const {
        timeout = 0,
        id,
        pollingInterval,
        retryCount = 6,
        confirmations = 1
    } = parameters

    const client = await getConnectorClient(config, {})

    const observerId = stringify(["waitForTransactionReceipt", client.uid, id])

    let count = 0
    let receipt: GetCallsStatusReturnType

    return new Promise((resolve, reject) => {
        if (timeout)
            setTimeout(
                () =>
                    reject(
                        new WaitForTransactionReceiptTimeoutError({
                            hash: id as Hash
                        })
                    ),
                timeout
            )

        const _unobserve = observe(observerId, { resolve, reject }, (emit) => {
            const _unwatch = getAction(
                client,
                watchBlockNumber,
                "watchBlockNumber"
            )({
                emitMissed: true,
                emitOnBegin: true,
                poll: true,
                pollingInterval,
                async onBlockNumber(blockNumber) {
                    const done = (fn: () => void) => {
                        _unwatch()
                        fn()
                        _unobserve()
                    }

                    if (count > retryCount)
                        done(() =>
                            emit.reject(
                                new WaitForTransactionReceiptTimeoutError({
                                    hash: id as Hash
                                })
                            )
                        )

                    try {
                        // If we already have a valid receipt, let's check if we have enough
                        // confirmations. If we do, then we can resolve.
                        if (receipt) {
                            if (
                                confirmations > 1 &&
                                (!receipt.receipts?.[0]?.blockNumber ||
                                    blockNumber -
                                        receipt.receipts?.[0]?.blockNumber +
                                        1n <
                                        confirmations)
                            )
                                return

                            if (receipt.status === "PENDING") {
                                return
                            }

                            if (receipt.receipts?.length === 0) {
                                return
                            }

                            const finalReceipt = receipt.receipts

                            if (!finalReceipt) {
                                return
                            }

                            const transactionReceipt = await getAction(
                                client,
                                getTransactionReceipt,
                                "getTransactionReceipt"
                            )({ hash: finalReceipt[0].transactionHash })

                            done(() =>
                                emit.resolve({
                                    ...transactionReceipt,
                                    chainId: client.chain.id
                                } as WaitForTransactionReceiptReturnType<
                                    config,
                                    chainId
                                >)
                            )
                            return
                        }

                        // Get the receipt to check if it's been processed.
                        receipt = await getAction(
                            client,
                            getCallsStatus,
                            "getCallsStatus"
                        )({ id })

                        if (receipt.status === "PENDING") {
                            return
                        }

                        // Check if we have enough confirmations. If not, continue polling.
                        if (
                            confirmations > 1 &&
                            (!receipt.receipts?.[0]?.blockNumber ||
                                blockNumber -
                                    receipt.receipts?.[0]?.blockNumber +
                                    1n <
                                    confirmations)
                        )
                            return

                        if (receipt.receipts?.length === 0) {
                            return
                        }

                        const finalReceipt = receipt.receipts

                        if (!finalReceipt) {
                            return
                        }

                        const transactionReceipt = await getAction(
                            client,
                            getTransactionReceipt,
                            "getTransactionReceipt"
                        )({ hash: finalReceipt[0].transactionHash })

                        done(() =>
                            emit.resolve({
                                ...transactionReceipt,
                                chainId: client.chain.id
                            } as WaitForTransactionReceiptReturnType<
                                config,
                                chainId
                            >)
                        )
                    } catch (err) {
                        done(() => emit.reject(err))
                    } finally {
                        count++
                    }
                }
            })
        })
    })
}

function waitForTransactionReceiptQueryOptions<
    config extends Config,
    chainId extends
        config["chains"][number]["id"] = config["chains"][number]["id"]
>(
    config: config,
    options: Omit<
        WaitForTransactionReceiptOptions<config, chainId>,
        "hash" | "onReplaced"
    > & {
        id?: string
        capabilities?: WalletSendCallsParameters<WalletCapabilities>[number]["capabilities"]
    }
) {
    return {
        async queryFn({ queryKey }) {
            const { scopeKey: _, id, ...parameters } = queryKey[1]
            if (!id) throw new Error("id is required")

            if (!options.capabilities && !isHash(id)) {
                throw new Error("capabilities or hash is required")
            }

            if (options.capabilities) {
                const status = await waitForCallsStatus(config, {
                    id,
                    ...parameters
                })

                return status
            }

            const status = await waitForTransactionReceipt(config, {
                hash: id as Hash,
                ...options,
                ...parameters
            })
            return status
        },
        queryKey: waitForTransactionReceiptQueryKey(options),
        retry(failureCount, error) {
            if (error instanceof ConnectorNotConnectedError) return false
            return failureCount < 3
        }
    } as const satisfies QueryOptions<
        WaitForTransactionReceiptQueryFnData<config, chainId>,
        WaitForTransactionReceiptErrorType | ShowCallsStatusErrorType,
        WaitForTransactionReceiptData<config, chainId>,
        WaitForTransactionReceiptQueryKey<config, chainId>
    >
}

export type UseCallsStatusReturnType<selectData = GetCallsStatusData> =
    UseQueryReturnType<selectData, GetCallsStatusErrorType>

export type UseWaitForTransactionReceiptReturnType<
    config extends Config = Config,
    chainId extends
        config["chains"][number]["id"] = config["chains"][number]["id"],
    selectData = WaitForTransactionReceiptData<config, chainId>
> = UseQueryReturnType<
    selectData,
    WaitForTransactionReceiptErrorType | ShowCallsStatusErrorType
>

export type UseWaitForTransactionReceiptParameters<
    config extends Config = Config,
    chainId extends
        config["chains"][number]["id"] = config["chains"][number]["id"],
    selectData = WaitForTransactionReceiptData<config, chainId>
> = Prettify<
    Omit<
        WaitForTransactionReceiptOptions<config, chainId>,
        "hash" | "onReplaced"
    > & {
        id?: string
    } & ConfigParameter<config> &
        QueryParameter<
            WaitForTransactionReceiptQueryFnData<config, chainId>,
            WaitForTransactionReceiptErrorType,
            selectData,
            WaitForTransactionReceiptQueryKey<config, chainId>
        >
>

export function useWaitForTransactionReceipt<
    config extends Config = ResolvedRegister["config"],
    chainId extends
        config["chains"][number]["id"] = config["chains"][number]["id"],
    selectData = WaitForTransactionReceiptData<config, chainId>
>(
    parameters: UseWaitForTransactionReceiptParameters<
        config,
        chainId,
        selectData
    > = {}
): UseWaitForTransactionReceiptReturnType<config, chainId, selectData> {
    const { query = {} } = parameters
    const { capabilities } = useAvailableCapabilities()

    const config = useConfig(parameters)
    const chainId = useChainId({ config })

    const enabled = Boolean(parameters.id && (query.enabled ?? true))

    const options = waitForTransactionReceiptQueryOptions(config, {
        ...parameters,
        chainId: parameters.chainId ?? chainId,
        capabilities
    })

    return useQuery({
        ...query,
        ...options,
        enabled
    }) as UseWaitForTransactionReceiptReturnType<config, chainId, selectData>
}
