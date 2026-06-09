import {
    type MutateOptions,
    type MutationOptions,
    useMutation
} from "@tanstack/react-query"
import { sendCalls, sendTransaction } from "@wagmi/core"
import type {
    Call,
    Capabilities,
    Prettify,
    SendCallsErrorType,
    SendTransactionErrorType,
    WalletSendCallsParameters
} from "viem"
import { type Config, type ResolvedRegister, useConfig } from "wagmi"
import type {
    SendTransactionVariables,
    UseMutationParameters,
    UseMutationReturnType
} from "wagmi/query"
import { useAvailableCapabilities } from "./useAvailableCapabilities.js"

const sendTransactionMutationOptions = <config extends Config>(
    config: config,
    parameters: {
        capabilities?: WalletSendCallsParameters<Capabilities>[number]["capabilities"]
    } = {}
) => {
    return {
        async mutationFn(variables) {
            if (parameters.capabilities) {
                const client = config.getClient({ chainId: variables.chainId })

                const paymasterServiceUrl = parameters.capabilities
                    ?.paymasterService?.url
                    ? parameters.capabilities?.paymasterService?.url
                    : parameters.capabilities?.paymasterService[client.chain.id]
                          ?.url

                const result = await sendCalls(config, {
                    // cast needed: wagmi's generic config makes `variables`' fields unreadable in this scope.
                    // TODO: `to` may be undefined (optional) yet sendCalls requires it — validate before use.
                    calls: [variables as Pick<Call, "to" | "data" | "value">],
                    capabilities: {
                        ...parameters.capabilities,
                        paymasterService: paymasterServiceUrl
                            ? {
                                  url: paymasterServiceUrl
                              }
                            : undefined
                    }
                })

                return result.id
            }

            return sendTransaction(config, variables)
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
        context,
        SendTransactionMutate<config, context>,
        SendTransactionMutateAsync<config, context>
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

export const useSendTransaction: <
    config extends Config = ResolvedRegister["config"],
    context = unknown
>(
    parameters?: UseSendTransactionParameters<config, context>
) => UseSendTransactionReturnType<config, context> = <
    config extends Config = ResolvedRegister["config"],
    context = unknown
>(
    parameters: UseSendTransactionParameters<config, context> = {}
) => {
    const { mutation } = parameters
    const { capabilities } = useAvailableCapabilities()

    const config = useConfig(parameters)

    const mutationOptions = sendTransactionMutationOptions(config, {
        ...parameters,
        capabilities
    })

    const result = useMutation({
        ...mutation,
        ...mutationOptions
    })

    return {
        ...result,
        // should we deprecate `sendTransaction` in favor of `mutate`?
        sendTransaction: result.mutate,
        sendTransactionAsync: result.mutateAsync
    }
}
