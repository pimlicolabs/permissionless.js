import {
    type Address,
    type BundlerRpcSchema,
    type Chain,
    type Client,
    type ContractFunctionParameters,
    type Transport,
    encodeFunctionData,
    getAddress,
    maxUint256,
    parseAbi
} from "viem"
import {
    type BundlerActions,
    type PrepareUserOperationParameters,
    type PrepareUserOperationRequest,
    type PrepareUserOperationReturnType,
    type SmartAccount,
    type UserOperationCall,
    prepareUserOperation
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import type { PimlicoRpcSchema } from "../../types/pimlico"
import { getRequiredPrefund } from "../../utils/getRequiredPrefund"
import { type PimlicoActions, getTokenQuotes } from "../pimlico"

export async function prepareUserOperationErc20<
    account extends SmartAccount,
    const calls extends readonly unknown[],
    const request extends PrepareUserOperationRequest<
        account,
        accountOverride,
        calls
    >,
    accountOverride extends SmartAccount | undefined = undefined,
    entryPointVersion extends "0.6" | "0.7" = "0.7" | "0.6",
    chain extends Chain | undefined = Chain | undefined
>(
    client: Client<
        Transport,
        Chain | undefined,
        account,
        [...BundlerRpcSchema, ...PimlicoRpcSchema],
        BundlerActions<account> & PimlicoActions<chain, entryPointVersion>
    >,
    parameters_: PrepareUserOperationParameters<
        account,
        accountOverride,
        calls,
        request
    >
): Promise<
    PrepareUserOperationReturnType<account, accountOverride, calls, request>
> {
    const parameters = parameters_ as PrepareUserOperationParameters
    const account = parseAccount(parameters.account) as SmartAccount

    const { paymasterContext } = parameters

    if (
        typeof paymasterContext === "object" &&
        paymasterContext !== null &&
        "token" in paymasterContext &&
        typeof paymasterContext.token === "string"
    ) {
        ////////////////////////////////////////////////////////////////////////////////
        // Inject custom approval before calling prepareUserOperation
        ////////////////////////////////////////////////////////////////////////////////

        const quotes = await getTokenQuotes(client, {
            tokens: [getAddress(paymasterContext.token)],
            entryPointAddress: account.entryPoint.address,
            // biome-ignore lint/style/noNonNullAssertion: TODO FIX THIS (HOW TO ASSERT THAT THERE IS A CHAIN???)
            chain: client.chain!
        })

        const {
            postOpGas,
            exchangeRate,
            paymaster: paymasterERC20Address
        } = quotes[0]

        const callsWithApproval = [
            {
                abi: parseAbi(["function approve(address,uint)"]),
                functionName: "approve",
                args: [paymasterERC20Address, maxUint256], // dummy approval to ensure simulation passes
                to: paymasterContext.token
            },
            ...(parameters.calls ? parameters.calls : [])
        ]

        if (parameters.callData) {
            throw new Error(
                "callData not supported in erc20 approval+sponsor flow"
            )
        }

        ////////////////////////////////////////////////////////////////////////////////
        // Call prepareUserOperation
        ////////////////////////////////////////////////////////////////////////////////

        const userOperation = (await getAction(
            client,
            prepareUserOperation,
            "prepareUserOperation"
        )({
            ...parameters,
            calls: callsWithApproval
        })) as PrepareUserOperationReturnType<
            account,
            accountOverride,
            calls,
            request
        >

        ////////////////////////////////////////////////////////////////////////////////
        // Call pimlico_getTokenQuotes and calculate the approval amount needed for op
        ////////////////////////////////////////////////////////////////////////////////

        const maxFeePerGas = parameters.maxFeePerGas

        if (!maxFeePerGas) {
            throw new Error("failed to get maxFeePerGas")
        }

        const userOperationPrefund = getRequiredPrefund({
            // @ts-ignore
            userOperation,
            entryPointVersion: client.account.entryPoint.version
        })

        // using formula here https://github.com/pimlicolabs/singleton-paymaster/blob/main/src/base/BaseSingletonPaymaster.sol#L334-L341
        const maxCostInToken =
            ((userOperationPrefund + postOpGas * maxFeePerGas) * exchangeRate) /
            BigInt(1e18)

        const finalCalls = [
            {
                abi: parseAbi(["function approve(address,uint)"]),
                functionName: "approve",
                args: [paymasterERC20Address, maxCostInToken],
                to: paymasterContext.token
            },
            ...parameters.calls
        ]

        // @ts-ignore
        userOperation.callData = await account.encodeCalls(
            finalCalls.map((call_) => {
                const call = call_ as
                    | UserOperationCall
                    | (ContractFunctionParameters & {
                          to: Address
                          value: bigint
                      })
                if ("abi" in call)
                    return {
                        data: encodeFunctionData(call),
                        to: call.to,
                        value: call.value
                    } as UserOperationCall
                return call as UserOperationCall
            })
        )

        return userOperation
    }

    // @ts-ignore
    return getAction(
        client,
        prepareUserOperation,
        "prepareUserOperation"
    )(parameters)
}
