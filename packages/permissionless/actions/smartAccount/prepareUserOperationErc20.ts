import type { Address } from "abitype"
import {
    type Chain,
    type Client,
    type ContractFunctionParameters,
    type Transport,
    concat,
    encodeFunctionData,
    getAddress,
    getContract,
    maxUint256,
    parseAbi,
    parseGwei
} from "viem"
import type { PublicClient } from "viem"
import {
    type BundlerClient,
    type EstimateUserOperationGasParameters,
    type PrepareUserOperationParameters,
    type PrepareUserOperationRequest,
    type PrepareUserOperationReturnType,
    type SmartAccount,
    type UserOperation,
    type UserOperationCall,
    estimateUserOperationGas,
    getPaymasterData as getPaymasterData_,
    getPaymasterStubData as getPaymasterStubData_
} from "viem/account-abstraction"
import { AccountNotFoundError } from "../../errors"
import { estimateFeesPerGas } from "viem/actions"
import { getAction, parseAccount } from "viem/utils"
import { getRequiredPrefund } from "../../utils/getRequiredPrefund"
import { getTokenQuotes } from "../pimlico"

const defaultParameters = [
    "factory",
    "fees",
    "gas",
    "paymaster",
    "nonce",
    "signature"
] as const

export async function prepareUserOperationErc20<
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
    publicClient: PublicClient,
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
    const {
        account: account_ = client.account,
        parameters: properties = defaultParameters
    } = parameters

    ////////////////////////////////////////////////////////////////////////////////
    // Assert that an Account is defined.
    ////////////////////////////////////////////////////////////////////////////////

    if (!account_) throw new AccountNotFoundError()
    const account = parseAccount(account_)

    ////////////////////////////////////////////////////////////////////////////////
    // Declare typed Bundler Client.
    ////////////////////////////////////////////////////////////////////////////////

    const bundlerClient = client as unknown as BundlerClient

    ////////////////////////////////////////////////////////////////////////////////
    // Declare Paymaster properties.
    ////////////////////////////////////////////////////////////////////////////////

    const paymaster = parameters.paymaster ?? bundlerClient?.paymaster
    const paymasterAddress =
        typeof paymaster === "string" ? paymaster : undefined
    const { getPaymasterStubData, getPaymasterData } = (() => {
        // If `paymaster: true`, we will assume the Bundler Client supports Paymaster Actions.
        if (paymaster === true)
            return {
                getPaymasterStubData: (
                    // biome-ignore lint/suspicious/noExplicitAny:
                    parameters: any
                ) =>
                    getAction(
                        bundlerClient,
                        getPaymasterStubData_,
                        "getPaymasterStubData"
                    )(parameters),
                getPaymasterData: (
                    // biome-ignore lint/suspicious/noExplicitAny:
                    parameters: any
                ) =>
                    getAction(
                        bundlerClient,
                        getPaymasterData_,
                        "getPaymasterData"
                    )(parameters)
            }

        // If Actions are passed to `paymaster` (via Paymaster Client or directly), we will use them.
        if (typeof paymaster === "object") {
            const { getPaymasterStubData, getPaymasterData } = paymaster
            return {
                getPaymasterStubData: (getPaymasterData && getPaymasterStubData
                    ? getPaymasterStubData
                    : getPaymasterData) as typeof getPaymasterStubData,
                getPaymasterData:
                    getPaymasterData && getPaymasterStubData
                        ? getPaymasterData
                        : undefined
            }
        }

        // No Paymaster functions.
        return {
            getPaymasterStubData: undefined,
            getPaymasterData: undefined
        }
    })()
    const paymasterContext = parameters.paymasterContext
        ? parameters.paymasterContext
        : bundlerClient?.paymasterContext

    ////////////////////////////////////////////////////////////////////////////////
    // Set up the User Operation request.
    ////////////////////////////////////////////////////////////////////////////////

    let request = {
        ...parameters,
        paymaster: paymasterAddress,
        sender: account.address
    } as PrepareUserOperationRequest

    ////////////////////////////////////////////////////////////////////////////////
    // *CUSTOM* inject custom approval call so that gas estimations are accurate
    ////////////////////////////////////////////////////////////////////////////////
    if (parameters.callData) {
        throw new Error(
            "callData field not supported for this action, only `calls` is currently supported"
        )
    }

    if (
        !paymasterContext ||
        typeof paymasterContext !== "object" ||
        !("token" in paymasterContext) ||
        typeof paymasterContext.token !== "string"
    ) {
        throw new Error(
            'Invalid paymasterContext. Expected an object with a "token" property.'
        )
    }

    const calls = [
        {
            abi: parseAbi(["function approve(address,uint)"]),
            functionName: "approve",
            args: [paymaster, maxUint256],
            to: paymasterContext.token
        },
        ...parameters.calls
    ]

    ////////////////////////////////////////////////////////////////////////////////
    // Concurrently prepare properties required to fill the User Operation.
    ////////////////////////////////////////////////////////////////////////////////

    const [callData, factory, fees, nonce, signature] = await Promise.all([
        (async () => {
            return account.encodeCalls(
                calls.map((call_) => {
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
        })(),
        (async () => {
            if (!properties.includes("factory")) return undefined
            if (parameters.initCode) return { initCode: parameters.initCode }
            if (parameters.factory && parameters.factoryData) {
                return {
                    factory: parameters.factory,
                    factoryData: parameters.factoryData
                }
            }

            const { factory, factoryData } = await account.getFactoryArgs()

            if (account.entryPoint.version === "0.6")
                return {
                    initCode:
                        factory && factoryData
                            ? concat([factory, factoryData])
                            : undefined
                }
            return {
                factory,
                factoryData
            }
        })(),
        (async () => {
            if (!properties.includes("fees")) return undefined

            // If the Bundler Client has a `estimateFeesPerGas` hook, run it.
            if (bundlerClient?.userOperation?.estimateFeesPerGas) {
                const fees =
                    await bundlerClient.userOperation.estimateFeesPerGas({
                        account,
                        bundlerClient,
                        userOperation: request as UserOperation
                    })
                request = {
                    ...request,
                    ...fees
                }
            }

            // If we have sufficient properties for fees, return them.
            if (
                typeof parameters.maxFeePerGas === "bigint" &&
                typeof parameters.maxPriorityFeePerGas === "bigint"
            )
                return request

            // Otherwise, we will need to estimate the fees to fill the fee properties.
            try {
                const client_ =
                    "client" in client ? (client.client as Client) : client
                const fees = await getAction(
                    client_,
                    estimateFeesPerGas,
                    "estimateFeesPerGas"
                )({
                    chain: client_.chain,
                    type: "eip1559"
                })
                return {
                    maxFeePerGas:
                        typeof parameters.maxFeePerGas === "bigint"
                            ? parameters.maxFeePerGas
                            : BigInt(
                                  // Bundlers unfortunately have strict rules on fee prechecks – we will need to set a generous buffer.
                                  Math.max(
                                      Number(2n * fees.maxFeePerGas),
                                      Number(parseGwei("3"))
                                  )
                              ),
                    maxPriorityFeePerGas:
                        typeof parameters.maxPriorityFeePerGas === "bigint"
                            ? parameters.maxPriorityFeePerGas
                            : BigInt(
                                  // Bundlers unfortunately have strict rules on fee prechecks – we will need to set a generous buffer.
                                  Math.max(
                                      Number(2n * fees.maxPriorityFeePerGas),
                                      Number(parseGwei("1"))
                                  )
                              )
                }
            } catch {
                return undefined
            }
        })(),
        (async () => {
            if (!properties.includes("nonce")) return undefined
            if (typeof parameters.nonce === "bigint") return parameters.nonce
            return account.getNonce()
        })(),
        (async () => {
            if (!properties.includes("signature")) return undefined
            return account.getStubSignature()
        })()
    ])

    ////////////////////////////////////////////////////////////////////////////////
    // Fill User Operation with the prepared properties from above.
    ////////////////////////////////////////////////////////////////////////////////

    if (typeof callData !== "undefined") request.callData = callData
    if (typeof factory !== "undefined")
        // biome-ignore lint/suspicious/noExplicitAny:
        request = { ...request, ...(factory as any) }
    // biome-ignore lint/suspicious/noExplicitAny:
    if (typeof fees !== "undefined") request = { ...request, ...(fees as any) }
    if (typeof nonce !== "undefined") request.nonce = nonce
    if (typeof signature !== "undefined") request.signature = signature

    ////////////////////////////////////////////////////////////////////////////////
    // `initCode` is required to be filled with EntryPoint 0.6.
    ////////////////////////////////////////////////////////////////////////////////

    // If no `initCode` is provided, we use an empty bytes string.
    if (account.entryPoint.version === "0.6" && !request.initCode)
        request.initCode = "0x"

    ////////////////////////////////////////////////////////////////////////////////
    // Fill User Operation with paymaster-related properties for **gas estimation**.
    ////////////////////////////////////////////////////////////////////////////////

    // console.log('wat')

    // If the User Operation is intended to be sponsored, we will need to fill the paymaster-related
    // User Operation properties required to estimate the User Operation gas.
    let isPaymasterPopulated = false
    if (
        properties.includes("paymaster") &&
        getPaymasterStubData &&
        !paymasterAddress &&
        !parameters.paymasterAndData
    ) {
        const {
            isFinal = false,
            sponsor,
            ...paymasterArgs
        } = await getPaymasterStubData({
            // biome-ignore lint/style/noNonNullAssertion:
            chainId: client.chain!.id!,
            entryPointAddress: account.entryPoint.address,
            context: paymasterContext,
            ...(request as UserOperation)
        })
        isPaymasterPopulated = isFinal
        request = {
            ...request,
            ...paymasterArgs
        } as PrepareUserOperationRequest
    }

    ////////////////////////////////////////////////////////////////////////////////
    // `paymasterAndData` is required to be filled with EntryPoint 0.6.
    ////////////////////////////////////////////////////////////////////////////////

    // If no `paymasterAndData` is provided, we use an empty bytes string.
    if (account.entryPoint.version === "0.6" && !request.paymasterAndData)
        request.paymasterAndData = "0x"

    ////////////////////////////////////////////////////////////////////////////////
    // Fill User Operation with gas-related properties.
    ////////////////////////////////////////////////////////////////////////////////

    if (properties.includes("gas")) {
        // If the Account has opinionated gas estimation logic, run the `estimateGas` hook and
        // fill the request with the prepared gas properties.
        if (account.userOperation?.estimateGas) {
            const gas = await account.userOperation.estimateGas(
                request as UserOperation
            )
            request = {
                ...request,
                ...gas
            } as PrepareUserOperationRequest
        }

        // If not all the gas properties are already populated, we will need to estimate the gas
        // to fill the gas properties.
        if (
            typeof request.callGasLimit === "undefined" ||
            typeof request.preVerificationGas === "undefined" ||
            typeof request.verificationGasLimit === "undefined" ||
            (request.paymaster &&
                typeof request.paymasterPostOpGasLimit === "undefined") ||
            (request.paymaster &&
                typeof request.paymasterVerificationGasLimit === "undefined")
        ) {
            const gas = await getAction(
                client,
                estimateUserOperationGas,
                "estimateUserOperationGas"
            )({
                account,
                // Some Bundlers fail if nullish gas values are provided for gas estimation :') –
                // so we will need to set a default zeroish value.
                callGasLimit: 0n,
                preVerificationGas: 0n,
                verificationGasLimit: 0n,
                ...(request.paymaster
                    ? {
                          paymasterPostOpGasLimit: 0n,
                          paymasterVerificationGasLimit: 0n
                      }
                    : {}),
                ...request
            } as EstimateUserOperationGasParameters)
            request = {
                ...request,
                callGasLimit: request.callGasLimit ?? gas.callGasLimit,
                preVerificationGas:
                    request.preVerificationGas ?? gas.preVerificationGas,
                verificationGasLimit:
                    request.verificationGasLimit ?? gas.verificationGasLimit,
                paymasterPostOpGasLimit:
                    request.paymasterPostOpGasLimit ??
                    gas.paymasterPostOpGasLimit,
                paymasterVerificationGasLimit:
                    request.paymasterVerificationGasLimit ??
                    gas.paymasterVerificationGasLimit
            } as PrepareUserOperationRequest
        }
    }

    ////////////////////////////////////////////////////////////////////////////////
    // Fill User Operation with paymaster-related properties for **sending** the User Operation.
    ////////////////////////////////////////////////////////////////////////////////

    // If the User Operation is intended to be sponsored, we will need to fill the paymaster-related
    // User Operation properties required to send the User Operation.
    if (
        properties.includes("paymaster") &&
        getPaymasterData &&
        !paymasterAddress &&
        !parameters.paymasterAndData &&
        !isPaymasterPopulated
    ) {
        // Retrieve paymaster-related User Operation properties to be used for **sending** the User Operation.
        const paymaster = await getPaymasterData({
            // biome-ignore lint/style/noNonNullAssertion:
            chainId: client.chain!.id!,
            entryPointAddress: account.entryPoint.address,
            context: paymasterContext,
            ...(request as UserOperation)
        })
        request = {
            ...request,
            ...paymaster
        } as PrepareUserOperationRequest
    }

    ////////////////////////////////////////////////////////////////////////////////
    // Remove redundant properties that do not conform to the User Operation schema.
    ////////////////////////////////////////////////////////////////////////////////

    // biome-ignore lint/performance/noDelete:
    delete request.calls
    // biome-ignore lint/performance/noDelete:
    delete request.parameters
    // biome-ignore lint/performance/noDelete:
    delete request.paymasterContext
    // biome-ignore lint/performance/noDelete:
    if (typeof request.paymaster !== "string") delete request.paymaster

    ////////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////////
    // *CUSTOM* Call pimlico_getTokenQuotes and calculate the approval amount
    ////////////////////////////////////////////////////////////////////////////////
    const quotes = await getTokenQuotes(client, {
        tokens: [getAddress(paymasterContext.token)],
        entryPointAddress: account.entryPoint.address,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        chain: client.chain!
    })

    const {
        postOpGas,
        exchangeRate,
        paymaster: paymasterERC20Address
    } = quotes[0]

    const paymasterContract = getContract({
        address: paymasterERC20Address,
        abi: parseAbi([
            "function getCostInToken(uint256 actualGasCost, uint256 postOpGas, uint256 actualUserOpFeePerGas, uint256 exchangeRate) public pure returns (uint256)"
        ]),
        client: publicClient
    })

    const maxFeePerGas = fees?.maxFeePerGas ?? parameters_.maxFeePerGas

    if (!maxFeePerGas) {
        throw new Error("failed to get maxFeePerGas")
    }

    const maxCostInToken = await paymasterContract.read.getCostInToken([
        getRequiredPrefund({
            userOperation: { ...(request as UserOperation) },
            entryPointVersion: "0.7"
        }),
        postOpGas,
        maxFeePerGas,
        exchangeRate
    ])

    // We approve 10% more to ensure approval always goes through
    const approvalAmount = (maxCostInToken * 110n) / 100n

    const finalCalls = [
        {
            abi: parseAbi(["function approve(address,uint)"]),
            functionName: "approve",
            args: [paymaster, approvalAmount],
            to: paymasterContext.token
        },
        ...parameters.calls
    ]

    request.callData = await account.encodeCalls(
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

    return request as unknown as PrepareUserOperationReturnType<
        account,
        accountOverride,
        calls,
        request
    >
}
