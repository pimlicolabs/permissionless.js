import {
    type Address,
    type Chain,
    type Client,
    type ContractFunctionParameters,
    type Transport,
    encodeFunctionData,
    erc20Abi,
    getAddress,
    isAddress,
    maxUint256
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
import { readContract } from "viem/actions"
import { getAction, parseAccount } from "viem/utils"
import { getTokenQuotes } from "../../actions/pimlico"

export const prepareUserOperationWithErc20Paymaster =
    (pimlicoClient: Client) =>
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

        const bundlerClient = client as unknown as BundlerClient

        const paymasterContext = parameters.paymasterContext
            ? parameters.paymasterContext
            : bundlerClient?.paymasterContext

        if (
            typeof paymasterContext === "object" &&
            paymasterContext !== null &&
            "token" in paymasterContext &&
            typeof paymasterContext.token === "string"
        ) {
            if (!isAddress(paymasterContext.token)) {
                throw new Error("paymasterContext.token is not a valid address")
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Inject custom approval before calling prepareUserOperation
            ////////////////////////////////////////////////////////////////////////////////

            const quotes = await getAction(
                pimlicoClient,
                getTokenQuotes,
                "getTokenQuotes"
            )({
                tokens: [getAddress(paymasterContext.token)],
                chain: pimlicoClient.chain ?? (client.chain as Chain),
                entryPointAddress: account.entryPoint.address
            })

            const {
                postOpGas,
                exchangeRate,
                paymaster: paymasterERC20Address
            } = quotes[0]

            const callsWithDummyApproval = [
                {
                    abi: erc20Abi,
                    functionName: "approve",
                    args: [paymasterERC20Address, maxUint256], // dummy approval to ensure simulation passes
                    to: paymasterContext.token
                },
                ...(parameters.calls ? parameters.calls : [])
            ]

            if (parameters.callData) {
                throw new Error(
                    "callData not supported in ERC-20 approval+sponsor flow"
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
                calls: callsWithDummyApproval
            } as unknown as PrepareUserOperationParameters)

            ////////////////////////////////////////////////////////////////////////////////
            // Call pimlico_getTokenQuotes and calculate the approval amount needed for op
            ////////////////////////////////////////////////////////////////////////////////

            const maxFeePerGas = userOperation.maxFeePerGas

            const userOperationMaxGas =
                userOperation.preVerificationGas +
                userOperation.callGasLimit +
                userOperation.verificationGasLimit +
                (userOperation.paymasterPostOpGasLimit || 0n) +
                (userOperation.paymasterVerificationGasLimit || 0n)

            const userOperationMaxCost = userOperationMaxGas * maxFeePerGas

            // using formula here https://github.com/pimlicolabs/singleton-paymaster/blob/main/src/base/BaseSingletonPaymaster.sol#L334-L341
            const maxCostInToken =
                ((userOperationMaxCost + postOpGas * maxFeePerGas) *
                    exchangeRate) /
                BigInt(1e18)

            ////////////////////////////////////////////////////////////////////////////////
            // Check if we need to approve the token
            // If the user has existing approval that is sufficient, skip approval injection
            ////////////////////////////////////////////////////////////////////////////////

            const publicClient = account.client

            const tokenBalance = await getAction(
                publicClient,
                readContract,
                "readContract"
            )({
                abi: erc20Abi,
                functionName: "allowance",
                args: [account.address, paymasterERC20Address],
                address: paymasterContext.token
            })

            const hasSufficientApproval = tokenBalance >= maxCostInToken

            const finalCalls = hasSufficientApproval
                ? parameters.calls
                : [
                      {
                          abi: erc20Abi,
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
            // Declare Paymaster properties. (taken from viem)
            ////////////////////////////////////////////////////////////////////////////////

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

                throw new Error(
                    "Expected paymaster: cannot sponsor ERC-20 without paymaster"
                )
            })()

            ////////////////////////////////////////////////////////////////////////////////
            // Re-calculate Paymaster data fields.
            ////////////////////////////////////////////////////////////////////////////////

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
