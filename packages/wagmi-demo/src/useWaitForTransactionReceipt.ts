"use client"

import type {
    DefaultError,
    QueryKey,
    QueryOptions
} from "@tanstack/react-query"
import type {
    Config,
    ResolvedRegister,
    WaitForTransactionReceiptErrorType
} from "@wagmi/core"
import { ConnectorNotConnectedError } from "@wagmi/core"
import type {
    GetCallsStatusData,
    GetCallsStatusErrorType,
    GetCallsStatusOptions,
    GetCallsStatusQueryFnData
} from "@wagmi/core/experimental"
import { getCallsStatus } from "@wagmi/core/experimental"
import type { WaitForTransactionReceiptData } from "@wagmi/core/query"
import type { Prettify } from "viem"
import { useChainId, useConfig } from "wagmi"
import {
    type UseQueryParameters,
    type UseQueryReturnType,
    useQuery
} from "wagmi/query"
import type { ConfigParameter } from "./useSendTransaction"

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

async function waitForTransactionReceipt<
    config extends Config,
    chainId extends
        config["chains"][number]["id"] = config["chains"][number]["id"]
>(
    config: Config,
    parameters: Partial<GetCallsStatusOptions> & {
        id: string
        chainId?:
            | (chainId extends config["chains"][number]["id"]
                  ? chainId
                  : undefined)
            | config["chains"][number]["id"]
            | undefined
    }
) {}

export function waitForTransactionReceiptQueryOptions<
    config extends Config,
    chainId extends
        config["chains"][number]["id"] = config["chains"][number]["id"]
>(
    config: config,
    options: Partial<GetCallsStatusOptions> & {
        chainId?:
            | (chainId extends config["chains"][number]["id"]
                  ? chainId
                  : undefined)
            | config["chains"][number]["id"]
            | undefined
    }
) {
    return {
        async queryFn({ queryKey }) {
            const { scopeKey: _, id, ...parameters } = queryKey[1]
            if (!id) throw new Error("id is required")
            const status = await waitForTransactionReceipt(config, {
                id,
                ...options,
                ...parameters
            })
            console.log(status)
            return status
        },
        queryKey: getCallsStatusQueryKey(options),
        retry(failureCount, error) {
            if (error instanceof ConnectorNotConnectedError) return false
            return failureCount < 3
        }
    } as const satisfies QueryOptions<
        GetCallsStatusQueryFnData,
        GetCallsStatusErrorType,
        GetCallsStatusData,
        ReturnType<typeof getCallsStatusQueryKey>
    >
}

export type UseCallsStatusReturnType<selectData = GetCallsStatusData> =
    UseQueryReturnType<selectData, GetCallsStatusErrorType>

export type UseWaitForTransactionReceiptReturnType<
    config extends Config = Config,
    chainId extends
        config["chains"][number]["id"] = config["chains"][number]["id"],
    selectData = WaitForTransactionReceiptData<config, chainId>
> = UseQueryReturnType<selectData, WaitForTransactionReceiptErrorType>

/** https://wagmi.sh/react/api/hooks/useCallsStatus */
export function useWaitForTransactionReceipt<
    config extends Config = ResolvedRegister["config"],
    chainId extends
        config["chains"][number]["id"] = config["chains"][number]["id"],
    selectData = GetCallsStatusData
>(
    parameters: UseCallsStatusParameters<config, chainId, selectData> & {
        capabilities?:
            | {
                  paymasterService?: undefined
              }
            | {
                  paymasterService: {
                      url: string
                  }
              }
    } = {}
): UseWaitForTransactionReceiptReturnType<config, chainId, selectData> {
    const { query = {} } = parameters

    const config = useConfig(parameters)
    const chainId = useChainId({ config })

    const enabled = Boolean(parameters.id && (query.enabled ?? true))

    const options = waitForTransactionReceiptQueryOptions(config, {
        ...parameters,
        chainId: parameters.chainId ?? chainId
    })

    return useQuery({
        ...query,
        ...options,
        enabled
    }) as UseWaitForTransactionReceiptReturnType<config, chainId, selectData>
}
