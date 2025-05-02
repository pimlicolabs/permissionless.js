import * as util from "node:util"
import type { FastifyReply, FastifyRequest } from "fastify"
import {
    type Account,
    type Address,
    BaseError,
    type Chain,
    type PublicClient,
    type RpcRequestError,
    type Transport,
    type WalletClient,
    getAddress,
    toHex
} from "viem"
import {
    type BundlerClient,
    type UserOperation,
    entryPoint06Address,
    entryPoint07Address,
    entryPoint08Address
} from "viem/account-abstraction"
import { fromZodError } from "zod-validation-error"
import {
    getSingletonPaymaster06Address,
    getSingletonPaymaster07Address,
    getSingletonPaymaster08Address,
    sponsorshipIcon
} from "./constants.js"
import { erc20Address } from "./helpers/erc20-utils.js"
import {
    InternalBundlerError,
    type JsonRpcSchema,
    RpcError,
    ValidationErrors,
    jsonRpcSchema,
    pimlicoGetTokenQuotesSchema,
    pmGetPaymasterData,
    pmGetPaymasterStubDataParamsSchema,
    pmSponsorUserOperationParamsSchema
} from "./helpers/schema.js"
import {
    type PaymasterMode,
    isTokenSupported,
    maxBigInt
} from "./helpers/utils.js"
import {
    getDummyPaymasterData,
    getSignedPaymasterData
} from "./singletonPaymasters.js"

const handleSponsorship = async ({
    userOperation,
    paymasterMode,
    bundler,
    paymaster,
    publicClient,
    paymasterSigner,
    estimateGas
}: {
    userOperation: UserOperation
    paymasterMode: PaymasterMode
    bundler: BundlerClient
    paymaster: Address
    publicClient: PublicClient
    paymasterSigner: WalletClient<Transport, Chain, Account>
    estimateGas: boolean
}) => {
    let op = {
        ...userOperation,
        ...getDummyPaymasterData({ is06: false, paymaster, paymasterMode })
    } as UserOperation

    const callGasLimit = userOperation.callGasLimit
    const verificationGasLimit = userOperation.verificationGasLimit
    const preVerificationGas = userOperation.preVerificationGas

    if (estimateGas) {
        try {
            const gasEstimates = await bundler.estimateUserOperationGas({
                ...op
            })

            op = {
                ...op,
                ...gasEstimates
            } as UserOperation

            op.callGasLimit = maxBigInt(op.callGasLimit, callGasLimit)
            op.preVerificationGas = maxBigInt(
                op.preVerificationGas,
                preVerificationGas
            )
            op.verificationGasLimit = maxBigInt(
                op.verificationGasLimit,
                verificationGasLimit
            )
        } catch (e: unknown) {
            if (!(e instanceof BaseError)) throw new InternalBundlerError()
            const err = e.walk() as RpcRequestError
            throw err
        }
    } else if (
        userOperation.preVerificationGas === 1n ||
        userOperation.verificationGasLimit === 1n ||
        userOperation.callGasLimit === 1n
    ) {
        throw new RpcError(
            "Gas Limit values (preVerificationGas, verificationGasLimit, callGasLimit) must be set",
            ValidationErrors.InvalidFields
        )
    }

    const result = {
        preVerificationGas: toHex(op.preVerificationGas),
        callGasLimit: toHex(op.callGasLimit),
        paymasterVerificationGasLimit: toHex(
            op.paymasterVerificationGasLimit || 0
        ),
        paymasterPostOpGasLimit: toHex(op.paymasterPostOpGasLimit || 0),
        verificationGasLimit: toHex(op.verificationGasLimit || 0),
        ...(await getSignedPaymasterData({
            publicClient,
            signer: paymasterSigner,
            userOp: userOperation,
            paymaster,
            paymasterMode
        }))
    }

    return result
}

const validateEntryPoint = (entryPoint: Address) => {
    if (
        entryPoint !== entryPoint06Address &&
        entryPoint !== entryPoint07Address &&
        entryPoint !== entryPoint08Address
    ) {
        throw new RpcError(
            "EntryPoint not supported",
            ValidationErrors.InvalidFields
        )
    }
}

const handleMethod = async ({
    parsedBody,
    paymasterSigner,
    publicClient,
    bundler
}: {
    bundler: BundlerClient
    paymasterSigner: WalletClient<Transport, Chain, Account>
    publicClient: PublicClient
    parsedBody: JsonRpcSchema
}) => {
    const [paymaster06, paymaster07, paymaster08] = [
        getSingletonPaymaster06Address(paymasterSigner.account.address),
        getSingletonPaymaster07Address(paymasterSigner.account.address),
        getSingletonPaymaster08Address(paymasterSigner.account.address)
    ]

    const epToPaymaster = {
        [entryPoint06Address]: paymaster06,
        [entryPoint07Address]: paymaster07,
        [entryPoint08Address]: paymaster08
    }

    if (parsedBody.method === "pm_sponsorUserOperation") {
        const params = pmSponsorUserOperationParamsSchema.safeParse(
            parsedBody.params
        )

        if (!params.success) {
            throw new RpcError(
                fromZodError(params.error).message,
                ValidationErrors.InvalidFields
            )
        }

        const [userOperation, entryPoint] = params.data
        validateEntryPoint(entryPoint)

        return await handleSponsorship({
            userOperation,
            paymasterMode: { mode: "verifying" },
            bundler,
            paymaster: epToPaymaster[entryPoint],
            publicClient,
            paymasterSigner,
            estimateGas: true
        })
    }

    if (parsedBody.method === "pm_getPaymasterStubData") {
        const params = pmGetPaymasterStubDataParamsSchema.safeParse(
            parsedBody.params
        )

        if (!params.success) {
            throw new RpcError(
                fromZodError(params.error).message,
                ValidationErrors.InvalidFields
            )
        }

        const [, entryPoint, , data] = params.data
        validateEntryPoint(entryPoint)

        const paymasterMode = getPaymasterMode(data)

        const sponsorData = {
            name: "Pimlico",
            icon: sponsorshipIcon
        }

        const dummyPaymasterGas =
            entryPoint === entryPoint06Address
                ? {}
                : {
                      paymasterVerificationGasLimit: toHex(50_000n),
                      paymasterPostOpGasLimit: toHex(100_000n)
                  }

        return {
            ...getDummyPaymasterData({
                is06: false,
                paymaster: epToPaymaster[entryPoint],
                paymasterMode
            }),
            ...dummyPaymasterGas,
            sponsor: sponsorData,
            isFinal: false
        }
    }

    if (parsedBody.method === "pm_getPaymasterData") {
        const params = pmGetPaymasterData.safeParse(parsedBody.params)

        if (!params.success) {
            throw new RpcError(
                fromZodError(params.error).message,
                ValidationErrors.InvalidFields
            )
        }

        const [userOperation, entryPoint, , data] = params.data
        validateEntryPoint(entryPoint)

        const paymasterMode = getPaymasterMode(data)

        return await handleSponsorship({
            userOperation: userOperation as UserOperation,
            paymasterMode,
            bundler,
            paymaster: epToPaymaster[entryPoint],
            publicClient,
            paymasterSigner,
            estimateGas: false
        })
    }

    if (parsedBody.method === "pm_validateSponsorshipPolicies") {
        return [
            {
                sponsorshipPolicyId: "sp_crazy_kangaroo",
                data: {
                    name: "Free ops for devs",
                    author: "foo",
                    icon: sponsorshipIcon,
                    description: "Free userOps :)"
                }
            }
        ]
    }

    if (parsedBody.method === "pimlico_getTokenQuotes") {
        const params = pimlicoGetTokenQuotesSchema.safeParse(parsedBody.params)

        if (!params.success) {
            throw new RpcError(
                fromZodError(params.error).message,
                ValidationErrors.InvalidFields
            )
        }

        const [context, entryPoint] = params.data
        const { tokens } = context

        const quotes = {
            [getAddress("0xffffffffffffffffffffffffffffffffffffffff")]: {
                exchangeRateNativeToUsd: "0x1a2b3c4d5e6f7890abcdef",
                exchangeRate: "0x3a7b9c8d6e5f4321",
                balanceSlot: "0x0",
                allowanceSlot: "0x1",
                postOpGas: "0x1a2b3c"
            },
            [erc20Address]: {
                exchangeRateNativeToUsd: "0x5cc717fbb3450c0000000",
                exchangeRate: "0x5cc717fbb3450c0000",
                balanceSlot: "0x5",
                allowanceSlot: "0x0",
                postOpGas: "0xc350"
            }
        }

        return {
            quotes: tokens
                .filter((t) => quotes[t]) // Filter out unrecongized tokens
                .map((token) => ({
                    ...quotes[token],
                    paymaster: epToPaymaster[entryPoint],
                    token
                }))
        }
    }

    throw new RpcError(
        `Attempted to call an unknown method ${parsedBody.method}`,
        ValidationErrors.InvalidFields
    )
}

export const createRpcHandler = ({
    bundler,
    publicClient,
    paymasterSigner
}: {
    bundler: BundlerClient
    publicClient: PublicClient
    paymasterSigner: WalletClient<Transport, Chain, Account>
}) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
        const body = request.body
        const parsedBody = jsonRpcSchema.safeParse(body)
        if (!parsedBody.success) {
            throw new RpcError(
                fromZodError(parsedBody.error).message,
                ValidationErrors.InvalidFields
            )
        }

        try {
            const result = await handleMethod({
                bundler,
                paymasterSigner,
                parsedBody: parsedBody.data,
                publicClient
            })

            return {
                jsonrpc: "2.0",
                id: parsedBody.data.id,
                result
            }
        } catch (err: unknown) {
            console.log(`JSON.stringify(err): ${util.inspect(err)}`)

            const error = {
                // biome-ignore lint/suspicious/noExplicitAny:
                message: (err as any).message,
                // biome-ignore lint/suspicious/noExplicitAny:
                data: (err as any).data,
                // biome-ignore lint/suspicious/noExplicitAny:
                code: (err as any).code ?? -32603
            }

            return {
                jsonrpc: "2.0",
                id: parsedBody.data.id,
                error
            }
        }
    }
}

const getPaymasterMode = (data: any): PaymasterMode => {
    if (data !== null && "token" in data) {
        isTokenSupported(data.token)

        return { mode: "erc20", token: data.token }
    }

    return { mode: "verifying" }
}
