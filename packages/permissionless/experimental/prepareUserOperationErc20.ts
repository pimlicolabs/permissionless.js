import {
    type Address,
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
    type BundlerClient,
    type PrepareUserOperationParameters,
    type PrepareUserOperationRequest,
    type PrepareUserOperationReturnType,
    type SmartAccount,
    type UserOperation,
    type UserOperationCall,
    getPaymasterData as getPaymasterData_,
    prepareUserOperation
} from "viem/account-abstraction"
import { getAction, parseAccount } from "viem/utils"
import type { PimlicoClient } from "../clients/pimlico"

export const prepareUserOperationErc20 =
    (pimlicoClient: PimlicoClient) =>
    async <
        account extends SmartAccount | undefined,
        const calls extends readonly unknown[],
        const request extends PrepareUserOperationRequest<
            account,
            accountOverride,
            calls
        >,
        accountOverride extends SmartAccount | undefined = undefined
    >(
        client: Client<Transport, Chain | undefined, account>,
        parameters_: PrepareUserOperationParameters<
            account,
            accountOverride,
            calls,
            request
        >
    ): Promise<
        PrepareUserOperationReturnType<account, accountOverride, calls, request>
    > => {
        const parameters = parameters_ as PrepareUserOperationParameters
        const account_ = client.account

        if (!account_) throw new Error("Account not found")
        const account = parseAccount(account_)

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

            const quotes = await pimlicoClient.getTokenQuotes({
                tokens: [getAddress(paymasterContext.token)],
                chain: pimlicoClient.chain ?? (client.chain as Chain)
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

            const userOperation = await getAction(
                client,
                prepareUserOperation,
                "prepareUserOperation"
            )({
                ...parameters,
                calls: callsWithApproval
            } as unknown as PrepareUserOperationParameters)

            ////////////////////////////////////////////////////////////////////////////////
            // Call pimlico_getTokenQuotes and calculate the approval amount needed for op
            ////////////////////////////////////////////////////////////////////////////////

            const maxFeePerGas =
                parameters.maxFeePerGas ?? userOperation.maxFeePerGas

            if (!maxFeePerGas) {
                throw new Error("failed to get maxFeePerGas")
            }

            const userOperationMaxGas =
                userOperation.preVerificationGas +
                userOperation.callGasLimit +
                userOperation.verificationGasLimit +
                (userOperation.paymasterPostOpGasLimit || 0n) +
                (userOperation.paymasterVerificationGasLimit || 0n)

            const userOperationMaxCost =
                userOperationMaxGas * userOperation.maxFeePerGas

            // using formula here https://github.com/pimlicolabs/singleton-paymaster/blob/main/src/base/BaseSingletonPaymaster.sol#L334-L341
            const maxCostInToken =
                ((userOperationMaxCost + postOpGas * maxFeePerGas) *
                    exchangeRate) /
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
            parameters.calls = finalCalls

            ////////////////////////////////////////////////////////////////////////////////
            // Declare Paymaster properties.
            ////////////////////////////////////////////////////////////////////////////////

            const bundlerClient = client as unknown as BundlerClient

            const paymaster = parameters.paymaster ?? bundlerClient?.paymaster
            const { getPaymasterData } = (() => {
                // If `paymaster: true`, we will assume the Bundler Client supports Paymaster Actions.
                if (paymaster === true)
                    return {
                        getPaymasterData: (parameters: any) =>
                            getAction(
                                bundlerClient,
                                getPaymasterData_,
                                "getPaymasterData"
                            )(parameters)
                    }

                // If Actions are passed to `paymaster` (via Paymaster Client or directly), we will use them.
                if (
                    typeof paymaster === "object" &&
                    paymaster.getPaymasterData
                ) {
                    const { getPaymasterData } = paymaster
                    return {
                        getPaymasterData
                    }
                }

                // No Paymaster functions, use paymasterFunction from Pimlico client.
                return {
                    getPaymasterData: pimlicoClient.getPaymasterData
                }
            })()

            const paymasterData = await getPaymasterData({
                // biome-ignore lint/style/noNonNullAssertion:
                chainId: client.chain!.id!,
                entryPointAddress: account.entryPoint.address,
                context: paymasterContext,
                ...(userOperation as UserOperation)
            })

            return {
                ...userOperation,
                ...paymasterData
            } as unknown as PrepareUserOperationReturnType<
                account,
                accountOverride,
                calls,
                request
            >
        }

        return (await getAction(
            client,
            prepareUserOperation,
            "prepareUserOperation"
        )(parameters)) as unknown as PrepareUserOperationReturnType<
            account,
            accountOverride,
            calls,
            request
        >
    }
