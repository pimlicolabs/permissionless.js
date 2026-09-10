import * as util from "node:util"
import type { FastifyReply, FastifyRequest } from "fastify"
import { type Chain, Errors, http } from "viem"
import { BundlerClient, EntryPoint, type UserOperation } from "viem/erc4337"
import { Address, Hex } from "viem/utils"
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
    jsonRpcSchema,
    type PaymasterContext,
    pimlicoGetTokenQuotesSchema,
    pmGetPaymasterData,
    pmGetPaymasterStubDataParamsSchema,
    pmSponsorUserOperationParamsSchema,
    RpcError,
    ValidationErrors
} from "./helpers/schema.js"
import {
    getChain,
    getPublicClient,
    isTokenSupported,
    maxBigInt,
    type PaymasterMode,
    type PublicClient,
    type WalletClient
} from "./helpers/utils.js"
import {
    getDummyPaymasterData,
    getSignedPaymasterData
} from "./singletonPaymasters.js"

const createBundlerClient = (chain: Chain.Chain, altoRpc: string) =>
    BundlerClient.create({ chain, transport: http(altoRpc) })

type Bundler = ReturnType<typeof createBundlerClient>

const handlePmSponsor = async ({
    entryPoint,
    userOperation,
    paymasterMode,
    bundler,
    paymaster,
    publicClient,
    paymasterSigner,
    estimateGas
}: {
    entryPoint: Address.Address
    userOperation: UserOperation.UserOperation
    paymasterMode: PaymasterMode
    bundler: Bundler
    paymaster: Address.Address
    publicClient: PublicClient
    paymasterSigner: WalletClient
    estimateGas: boolean
}) => {
    const is06 = entryPoint === EntryPoint.addressV06

    let sponsoredUserOp = {
        ...userOperation,
        ...getDummyPaymasterData({ is06, paymaster, paymasterMode })
    } as UserOperation.UserOperation

    // User provided gasLimits
    const callGasLimit = userOperation.callGasLimit
    const verificationGasLimit = userOperation.verificationGasLimit
    const preVerificationGas = userOperation.preVerificationGas

    if (estimateGas) {
        try {
            const gasEstimates = await bundler.userOperation.estimateGas({
                ...sponsoredUserOp,
                entryPointAddress: entryPoint
            } as unknown as Parameters<
                typeof bundler.userOperation.estimateGas
            >[0])

            sponsoredUserOp = {
                ...sponsoredUserOp,
                ...gasEstimates
            } as UserOperation.UserOperation

            sponsoredUserOp.callGasLimit = maxBigInt(
                gasEstimates.callGasLimit,
                callGasLimit
            )
            sponsoredUserOp.preVerificationGas = maxBigInt(
                gasEstimates.preVerificationGas,
                preVerificationGas
            )
            sponsoredUserOp.verificationGasLimit = maxBigInt(
                gasEstimates.verificationGasLimit,
                verificationGasLimit
            )
        } catch (e: unknown) {
            if (!(e instanceof Errors.BaseError))
                throw new InternalBundlerError()
            throw e.walk()
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
        preVerificationGas: Hex.fromNumber(sponsoredUserOp.preVerificationGas),
        callGasLimit: Hex.fromNumber(sponsoredUserOp.callGasLimit),
        paymasterVerificationGasLimit: Hex.fromNumber(
            sponsoredUserOp.paymasterVerificationGasLimit || 0
        ),
        paymasterPostOpGasLimit: Hex.fromNumber(
            sponsoredUserOp.paymasterPostOpGasLimit || 0
        ),
        verificationGasLimit: Hex.fromNumber(
            sponsoredUserOp.verificationGasLimit || 0
        ),
        ...(await getSignedPaymasterData({
            publicClient,
            signer: paymasterSigner,
            userOp: sponsoredUserOp,
            paymaster,
            paymasterMode
        }))
    }

    return result
}

const validateEntryPoint = (entryPoint: Address.Address) => {
    if (
        entryPoint !== EntryPoint.addressV06 &&
        entryPoint !== EntryPoint.addressV07 &&
        entryPoint !== EntryPoint.addressV08
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
    bundlerClient
}: {
    bundlerClient: Bundler
    paymasterSigner: WalletClient
    publicClient: PublicClient
    parsedBody: JsonRpcSchema
}) => {
    const [paymaster06, paymaster07, paymaster08] = [
        getSingletonPaymaster06Address(paymasterSigner.account.address),
        getSingletonPaymaster07Address(paymasterSigner.account.address),
        getSingletonPaymaster08Address(paymasterSigner.account.address)
    ]

    const epToPaymaster: Record<Address.Address, Address.Address> = {
        [EntryPoint.addressV06]: paymaster06,
        [EntryPoint.addressV07]: paymaster07,
        [EntryPoint.addressV08]: paymaster08
    }

    const getPaymaster = (entryPoint: Address.Address): Address.Address => {
        const paymaster = epToPaymaster[entryPoint]
        if (paymaster === undefined) {
            throw new RpcError(
                "EntryPoint not supported",
                ValidationErrors.InvalidFields
            )
        }
        return paymaster
    }

    const request = bundlerClient.request as (args: {
        method: string
        params?: unknown
    }) => Promise<unknown>

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

        return await handlePmSponsor({
            entryPoint,
            userOperation,
            paymasterMode: { mode: "verifying" },
            bundler: bundlerClient,
            paymaster: getPaymaster(entryPoint),
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

        const is06 = entryPoint === EntryPoint.addressV06

        const dummyPaymasterGas = is06
            ? {}
            : {
                  paymasterVerificationGasLimit: Hex.fromNumber(50_000n),
                  paymasterPostOpGasLimit: Hex.fromNumber(100_000n)
              }

        return {
            ...getDummyPaymasterData({
                is06,
                paymaster: getPaymaster(entryPoint),
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

        return await getSignedPaymasterData({
            signer: paymasterSigner,
            userOp: userOperation as UserOperation.UserOperation,
            paymasterMode: getPaymasterMode(data),
            paymaster: getPaymaster(entryPoint),
            publicClient
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
            [Address.checksum("0xffffffffffffffffffffffffffffffffffffffff")]: {
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

    // If boosted userOp, forward to bundler's boost_sendUserOperation method.
    if (parsedBody.method === "eth_sendUserOperation") {
        const userOp = parsedBody.params[0] as {
            maxFeePerGas?: string
            maxPriorityFeePerGas?: string
        }

        const isBoosted =
            userOp.maxFeePerGas === "0x0" &&
            userOp.maxPriorityFeePerGas === "0x0"

        if (isBoosted) {
            return await request({
                method: "boost_sendUserOperation",
                params: parsedBody.params
            })
        }
    }

    // Forward all other requests to the bundler
    return await request({
        method: parsedBody.method,
        params: parsedBody.params ?? []
    })
}

export const createRpcHandler: (params: {
    altoRpc: string
    anvilRpc: string
    paymasterSigner: WalletClient
}) => (
    request: FastifyRequest,
    _reply: FastifyReply
) => Promise<{
    jsonrpc: string
    id: number
    result?: unknown
    error?: { message: string; data: unknown; code: number }
}> = ({ altoRpc, anvilRpc, paymasterSigner }) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
        const publicClient = await getPublicClient(anvilRpc)
        const bundlerClient = createBundlerClient(
            await getChain(anvilRpc),
            altoRpc
        )

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
                bundlerClient,
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

            const { message, data, code } = err as {
                message: string
                data?: unknown
                code?: number
            }
            const error = { message, data, code: code ?? -32603 }

            return {
                jsonrpc: "2.0",
                id: parsedBody.data.id,
                error
            }
        }
    }
}

const getPaymasterMode = (data: PaymasterContext): PaymasterMode => {
    if (data !== null && "token" in data) {
        isTokenSupported(data.token)
        return { mode: "erc20", token: data.token }
    }

    return { mode: "verifying" }
}
