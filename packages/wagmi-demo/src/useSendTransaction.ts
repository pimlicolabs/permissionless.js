"use client"

import {
    type MutateOptions,
    type MutationOptions,
    useMutation
} from "@tanstack/react-query"
import { sendTransaction } from "@wagmi/core"
import { sendCalls } from "@wagmi/core/experimental"
import { useContext } from "react"
import type { Prettify, SendTransactionErrorType } from "viem"
import type { SendCallsErrorType, SendCallsReturnType } from "viem/experimental"
import { type Config, type ResolvedRegister, useConfig } from "wagmi"
import type {
    SendTransactionData,
    SendTransactionVariables,
    UseMutationParameters,
    UseMutationReturnType
} from "wagmi/query"
import { PaymasterServiceContext } from "./usePaymasterService"

export type SendTransactionMutate<config extends Config, context = unknown> = <
    chainId extends config["chains"][number]["id"]
>(
    variables: SendTransactionVariables<config, chainId>,
    options?:
        | Prettify<
              MutateOptions<
                  SendTransactionData | SendCallsReturnType,
                  SendTransactionErrorType | SendCallsErrorType,
                  Prettify<SendTransactionVariables<config, chainId>>,
                  context
              >
          >
        | undefined
) => void

export type SendTransactionMutateAsync<
    config extends Config,
    context = unknown
> = <chainId extends config["chains"][number]["id"]>(
    variables: SendTransactionVariables<config, chainId>,
    options?:
        | Prettify<
              MutateOptions<
                  SendTransactionData | SendCallsReturnType,
                  SendTransactionErrorType | SendCallsErrorType,
                  Prettify<SendTransactionVariables<config, chainId>>,
                  context
              >
          >
        | undefined
) => Promise<SendTransactionData>

export type UseSendTransactionReturnType<
    config extends Config = Config,
    context = unknown
> = Prettify<
    UseMutationReturnType<
        SendTransactionData | SendCallsReturnType,
        SendTransactionErrorType | SendCallsErrorType,
        SendTransactionVariables<config, config["chains"][number]["id"]>,
        context
    > & {
        sendTransaction: SendTransactionMutate<config, context>
        sendTransactionAsync: SendTransactionMutateAsync<config, context>
    }
>

export type ConfigParameter<config extends Config = Config> = {
    config?: Config | config | undefined
}

export type UseSendTransactionParameters<
    config extends Config = Config,
    context = unknown
> = Prettify<
    ConfigParameter<config> & {
        mutation?:
            | UseMutationParameters<
                  SendTransactionData | SendCallsReturnType,
                  SendTransactionErrorType | SendCallsErrorType,
                  SendTransactionVariables<
                      config,
                      config["chains"][number]["id"]
                  >,
                  context
              >
            | undefined
    }
>

const sendTransactionMutationOptions = <config extends Config>(
    config: config,
    parameters: {
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
) => {
    return {
        mutationFn(variables) {
            if (
                parameters.capabilities &&
                "paymasterService" in parameters.capabilities
            ) {
                return sendCalls(config, {
                    calls: [variables],
                    capabilities: parameters.capabilities
                })
            }

            return sendTransaction(config, variables)
        },
        mutationKey: ["sendTransaction"]
    } as const satisfies MutationOptions<
        SendTransactionData | SendCallsReturnType,
        SendTransactionErrorType | SendCallsErrorType,
        SendTransactionVariables<config, config["chains"][number]["id"]>
    >
}

export const useSendTransaction = <
    config extends Config = ResolvedRegister["config"],
    context = unknown
>(
    parameters: UseSendTransactionParameters<config, context> & {
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
) => {
    const { mutation } = parameters
    const capabilities = useContext(PaymasterServiceContext)

    const config = useConfig(parameters)

    const mutationOptions = sendTransactionMutationOptions(config, {
        ...parameters,
        capabilities: {
            paymasterService: capabilities.url
                ? {
                      url: capabilities.url
                  }
                : undefined,
            ...parameters.capabilities
        }
    })

    const { mutate, mutateAsync, ...result } = useMutation({
        ...mutation,
        ...mutationOptions
    })

    type Return = UseSendTransactionReturnType<config, context>
    return {
        ...result,
        sendTransaction: mutate as Return["sendTransaction"],
        sendTransactionAsync: mutateAsync as Return["sendTransactionAsync"]
    }
}
