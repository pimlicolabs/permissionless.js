import { Actions, type Chain, type Client } from "viem"
import {
    type BundlerClient,
    Actions as Erc4337Actions,
    type SmartAccount,
    type UserOperation
} from "viem/erc4337"
import {
    type Abi,
    AbiFunction,
    Abis,
    Address,
    type Hex,
    Solidity,
    type StateOverrides
} from "viem/utils"
import { AccountNotFoundError } from "../../errors/account.js"
import {
    BalanceSlotRequiredError,
    Erc20PaymasterRequiredError,
    TokenQuoteNotFoundError
} from "../../errors/erc20Paymaster.js"
import { getAction } from "../../utils/getAction.js"
import { balanceOverride as erc20BalanceOverride } from "./balanceOverride.js"
import { getTokenQuotes } from "./getTokenQuotes.js"

const MAINNET_USDT_ADDRESS = Address.checksum(
    "0xdAC17F958D2ee523a2206206994597C13D831ec7"
)

type PaymasterActions = {
    getData?: PaymasterGetData | undefined
    getStubData?: PaymasterGetData | undefined
}

type PaymasterGetData = (
    options: Erc4337Actions.paymaster.getData.Options
) => Promise<Erc4337Actions.paymaster.getData.ReturnType>

const resolvePaymasterActions = (
    paymaster: Address.Address | BundlerClient.Paymaster | undefined
): PaymasterActions | undefined => {
    if (typeof paymaster !== "object") return undefined
    return (
        "paymaster" in paymaster ? paymaster.paymaster : paymaster
    ) as PaymasterActions
}

export type PrepareUserOperationParameters = {
    balanceOverride?: boolean
    balanceSlot?: bigint
}

export const prepareUserOperation =
    (
        pimlicoClient: Pick<Client.Client, "chain" | "request">,
        {
            balanceOverride = false,
            balanceSlot: _balanceSlot
        }: PrepareUserOperationParameters = {}
    ) =>
    async <
        account extends SmartAccount.SmartAccount | undefined,
        const calls extends readonly unknown[],
        const request extends Erc4337Actions.userOperation.prepare.Options<
            account,
            accountOverride,
            calls
        >,
        accountOverride extends
            | SmartAccount.SmartAccount
            | undefined = undefined
    >(
        client: BundlerClient.Client<Chain.Chain | undefined, account>,
        parameters_: Erc4337Actions.userOperation.prepare.Options<
            account,
            accountOverride,
            calls
        > &
            request
    ): Promise<
        Erc4337Actions.userOperation.prepare.ReturnType<
            account,
            accountOverride,
            calls,
            request
        >
    > => {
        const parameters =
            parameters_ as Erc4337Actions.userOperation.prepare.Options
        const account_ = client.account

        if (!account_) throw new AccountNotFoundError()
        const account = account_ as SmartAccount.SmartAccount

        const bundlerClient = client as BundlerClient.Client

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

            const token = Address.checksum(paymasterContext.token)

            let chainId: number | undefined
            async function getChainId(): Promise<number> {
                if (chainId) return chainId
                if (client.chain) return client.chain.id
                const chainId_ = await getAction(
                    client,
                    Actions.chains.getId,
                    "chains.getId"
                )(undefined)
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

            const quote = quotes[0]

            if (quote === undefined)
                throw new TokenQuoteNotFoundError({ token })

            const {
                postOpGas,
                exchangeRate,
                paymaster: paymasterERC20Address
            } = quote

            let calls = parameters.calls

            if (parameters.callData && account.decodeCalls) {
                calls = await account.decodeCalls(parameters.callData)
            }

            // Create basic approval call array with max approval
            const callsWithDummyApproval = [
                {
                    abi: Abis.erc20,
                    functionName: "approve",
                    args: [paymasterERC20Address, Solidity.maxUint256], // dummy approval to ensure simulation passes
                    to: paymasterContext.token
                },
                ...(calls ? calls : [])
            ]

            // For USDT on mainnet, add zero approval at the beginning
            if (token === MAINNET_USDT_ADDRESS) {
                callsWithDummyApproval.unshift({
                    abi: Abis.erc20,
                    functionName: "approve",
                    args: [paymasterERC20Address, 0n],
                    to: MAINNET_USDT_ADDRESS
                })
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Call prepareUserOperation
            ////////////////////////////////////////////////////////////////////////////////

            const balanceSlot = _balanceSlot ?? quote.balanceSlot
            const hasBalanceSlot = balanceSlot !== undefined

            if (!hasBalanceSlot && balanceOverride)
                throw new BalanceSlotRequiredError({ token })

            const balanceStateOverride =
                balanceOverride && hasBalanceSlot
                    ? erc20BalanceOverride({
                          token,
                          owner: account.address,
                          slot: balanceSlot
                      })[token]
                    : undefined

            if (balanceOverride && balanceStateOverride) {
                const existing = parameters.stateOverride?.[token]
                parameters.stateOverride = {
                    ...parameters.stateOverride,
                    [token]: {
                        ...existing,
                        stateDiff: {
                            ...existing?.stateDiff,
                            ...balanceStateOverride.stateDiff
                        }
                    }
                } as StateOverrides.StateOverrides
            }

            const userOperation = await getAction(
                client,
                Erc4337Actions.userOperation.prepare,
                "userOperation.prepare"
            )({
                ...parameters,
                paymaster: {
                    getData: (
                        args: Erc4337Actions.paymaster.getData.Options
                    ): Promise<Erc4337Actions.paymaster.getData.ReturnType> => {
                        const paymaster =
                            parameters.paymaster ?? bundlerClient?.paymaster

                        const getStubData =
                            resolvePaymasterActions(paymaster)?.getStubData

                        if (getStubData) {
                            return getStubData(args)
                        }

                        return getAction(
                            bundlerClient,
                            Erc4337Actions.paymaster.getData,
                            "paymaster.getData"
                        )(args)
                    }
                },
                calls: callsWithDummyApproval
            } as unknown as Erc4337Actions.userOperation.prepare.Options)

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
                Actions.contract.read,
                "contract.read"
            )({
                abi: Abis.erc20,
                functionName: "allowance",
                args: [account.address, paymasterERC20Address],
                address: token
            })

            const hasSufficientApproval = allowance >= maxCostInToken

            const finalCalls: unknown[] = calls ? [...calls] : []

            if (!hasSufficientApproval) {
                finalCalls.unshift({
                    abi: Abis.erc20,
                    functionName: "approve",
                    args: [paymasterERC20Address, maxCostInToken],
                    to: paymasterContext.token
                })

                // For USDT on mainnet, add zero approval at the beginning
                if (token === MAINNET_USDT_ADDRESS) {
                    finalCalls.unshift({
                        abi: Abis.erc20,
                        functionName: "approve",
                        args: [paymasterERC20Address, 0n],
                        to: MAINNET_USDT_ADDRESS
                    })
                }
            }

            userOperation.callData = await account.encodeCalls(
                finalCalls.map((call_) => {
                    const call = call_ as
                        | {
                              to: Address.Address
                              value: bigint
                              data: Hex.Hex
                          }
                        | {
                              abi: Abi.Abi
                              functionName: string
                              args?: readonly unknown[] | undefined
                              to: Address.Address
                              value: bigint
                          }
                    if ("abi" in call)
                        return {
                            data: AbiFunction.encodeData(
                                AbiFunction.fromAbi(
                                    call.abi,
                                    call.functionName,
                                    {
                                        args: call.args
                                    }
                                ),
                                call.args
                            ),
                            to: call.to,
                            value: call.value
                        }
                    return call
                })
            )
            parameters.calls = finalCalls

            ////////////////////////////////////////////////////////////////////////////////
            // Declare Paymaster properties. (taken from viem)
            ////////////////////////////////////////////////////////////////////////////////

            const paymaster = parameters.paymaster ?? bundlerClient?.paymaster
            const { getData } = (() => {
                // If `paymaster: true`, we will assume the Bundler Client supports Paymaster Actions.
                if (paymaster === true)
                    return {
                        getData: (
                            parameters: Erc4337Actions.paymaster.getData.Options
                        ) =>
                            getAction(
                                bundlerClient,
                                Erc4337Actions.paymaster.getData,
                                "paymaster.getData"
                            )(parameters)
                    }

                // If Actions are passed to `paymaster` (via Paymaster Client or directly), we will use them.
                const getData = resolvePaymasterActions(paymaster)?.getData
                if (getData) {
                    return { getData }
                }

                throw new Erc20PaymasterRequiredError()
            })()

            ////////////////////////////////////////////////////////////////////////////////
            // Re-calculate Paymaster data fields.
            ////////////////////////////////////////////////////////////////////////////////

            const paymasterData = await getData({
                chainId: await getChainId(),
                entryPointAddress: account.entryPoint.address,
                context: paymasterContext,
                ...(userOperation as UserOperation.UserOperation)
            })

            return {
                ...userOperation,
                ...paymasterData
            } as unknown as Erc4337Actions.userOperation.prepare.ReturnType<
                account,
                accountOverride,
                calls,
                request
            >
        }

        return (await getAction(
            client,
            Erc4337Actions.userOperation.prepare,
            "userOperation.prepare"
        )(
            parameters
        )) as unknown as Erc4337Actions.userOperation.prepare.ReturnType<
            account,
            accountOverride,
            calls,
            request
        >
    }
