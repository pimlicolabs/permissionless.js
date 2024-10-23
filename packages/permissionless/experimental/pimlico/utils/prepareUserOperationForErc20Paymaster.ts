import {
    type Address,
    type Chain,
    type Client,
    type ContractFunctionParameters,
    RpcError,
    type Transport,
    encodeFunctionData,
    erc20Abi,
    getAddress,
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
import { getChainId as getChainId_ } from "viem/actions"
import { readContract } from "viem/actions"
import { getAction, parseAccount } from "viem/utils"
import { getTokenQuotes } from "../../../actions/pimlico"
import { erc20AllowanceOverride, erc20BalanceOverride } from "../../../utils"

export const prepareUserOperationForErc20Paymaster =
    (
        pimlicoClient: Client,
        {
            balanceOverride = false,
            balanceSlot: _balanceSlot,
            allowanceSlot: _allowanceSlot
        }: {
            balanceOverride?: boolean
            balanceSlot?: bigint
            allowanceSlot?: bigint
        } = {}
    ) =>
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
            ////////////////////////////////////////////////////////////////////////////////
            // Inject custom approval before calling prepareUserOperation
            ////////////////////////////////////////////////////////////////////////////////

            const token = getAddress(paymasterContext.token)

            let chainId: number | undefined
            async function getChainId(): Promise<number> {
                if (chainId) return chainId
                if (client.chain) return client.chain.id
                const chainId_ = await getAction(
                    client,
                    getChainId_,
                    "getChainId"
                )({})
                chainId = chainId_
                return chainId
            }

            const quotes = await getAction(
                pimlicoClient,
                getTokenQuotes,
                "getTokenQuotes"
            )({
                tokens: [token],
                chain:
                    pimlicoClient.chain ?? client.chain ?? account.client.chain,
                entryPointAddress: account.entryPoint.address
            })

            if (quotes.length === 0) {
                throw new RpcError(new Error("Quotes not found"), {
                    shortMessage:
                        "client didn't return token quotes, check if the token is supported"
                })
            }

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
                    "parameter callData is not supported with prepareUserOperationForErc20Paymaster"
                )
            }

            ////////////////////////////////////////////////////////////////////////////////

            // Call prepareUserOperation
            ////////////////////////////////////////////////////////////////////////////////

            const allowanceSlot = _allowanceSlot ?? quotes[0].allowanceSlot
            const balanceSlot = _balanceSlot ?? quotes[0].balanceSlot

            const hasSlot = allowanceSlot && balanceSlot

            if (!hasSlot && balanceOverride) {
                throw new Error(
                    `balanceOverride is not supported for token ${token}, provide custom slot for balance & allowance overrides`
                )
            }

            const balanceStateOverride =
                balanceOverride && balanceSlot
                    ? erc20BalanceOverride({
                          token,
                          owner: account.address,
                          slot: balanceSlot
                      })[0]
                    : undefined

            const allowanceStateOverride =
                balanceOverride && allowanceSlot
                    ? erc20AllowanceOverride({
                          token,
                          owner: account.address,
                          spender: paymasterERC20Address,
                          slot: allowanceSlot
                      })[0]
                    : undefined

            parameters.stateOverride =
                balanceOverride &&
                balanceStateOverride &&
                allowanceStateOverride // allowanceSlot && balanceSlot is cuz of TypeScript :/
                    ? (parameters.stateOverride ?? []).concat([
                          {
                              address: token,
                              stateDiff: [
                                  ...(allowanceStateOverride.stateDiff ?? []),
                                  ...(balanceStateOverride.stateDiff ?? [])
                              ]
                          }
                      ])
                    : parameters.stateOverride

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

            const allowance = await getAction(
                publicClient,
                readContract,
                "readContract"
            )({
                abi: erc20Abi,
                functionName: "allowance",
                args: [account.address, paymasterERC20Address],
                address: token
            })

            const hasSufficientApproval = allowance >= maxCostInToken

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
                chainId: await getChainId(),
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
