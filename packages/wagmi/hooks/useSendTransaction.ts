import {
    type MutateOptions,
    type MutationOptions,
    useMutation
} from "@tanstack/react-query"
import { sendTransaction } from "@wagmi/core"
import { sendCalls } from "@wagmi/core/experimental"
import type {
    Prettify,
    SendTransactionErrorType,
    WalletCapabilities,
    WalletSendCallsParameters
} from "viem"
import type { SendCallsErrorType } from "viem/experimental"
import { type Config, type ResolvedRegister, useConfig } from "wagmi"
import type {
    SendTransactionVariables,
    UseMutationParameters,
    UseMutationReturnType
} from "wagmi/query"
import { useAvailableCapabilities } from "./useAvailableCapabilities"

const sendTransactionMutationOptions = <config extends Config>(
    config: config,
    parameters: {
        capabilities?: WalletSendCallsParameters<WalletCapabilities>[number]["capabilities"]
    } = {}
) => {
    return {
        mutationFn(variables) {
            if (parameters.capabilities) {
                return sendCalls(config, {
                    calls: [variables],
                    capabilities: parameters.capabilities
                })
            }

            return sendTransaction(config, variables) as Promise<string>
        },
        mutationKey: ["sendTransaction"]
    } as const satisfies MutationOptions<
        SendTransactionData,
        SendTransactionErrorType | SendCallsErrorType,
        SendTransactionVariables<config, config["chains"][number]["id"]>
    >
}

export type SendTransactionData = string

export type SendTransactionMutate<config extends Config, context = unknown> = <
    chainId extends config["chains"][number]["id"]
>(
    variables: SendTransactionVariables<config, chainId>,
    options?:
        | Prettify<
              MutateOptions<
                  SendTransactionData,
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
                  SendTransactionData,
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
        SendTransactionData,
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
    config extends Config = ResolvedRegister["config"],
    context = unknown
> = Prettify<
    ConfigParameter<config> & {
        mutation?:
            | UseMutationParameters<
                  SendTransactionData,
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

export const useSendTransaction = <
    config extends Config = ResolvedRegister["config"],
    context = unknown
>(
    parameters: UseSendTransactionParameters<config, context> = {}
): UseSendTransactionReturnType<config, context> => {
    const { mutation } = parameters
    const { capabilities } = useAvailableCapabilities()

    const config = useConfig(parameters)

    const mutationOptions = sendTransactionMutationOptions(config, {
        ...parameters,
        capabilities
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
