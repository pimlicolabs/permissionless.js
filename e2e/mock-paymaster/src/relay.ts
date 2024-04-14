import type { FastifyReply, FastifyRequest } from "fastify"
import {
    ENTRYPOINT_ADDRESS_V07,
    getPackedUserOperation,
    type EstimateUserOperationGasReturnType
} from "permissionless"
import type { PimlicoBundlerClient } from "permissionless/clients/pimlico"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    UserOperation
} from "permissionless/types"
import {
    type Account,
    type Chain,
    type GetContractReturnType,
    type Hex,
    type PublicClient,
    RpcRequestError,
    type Transport,
    type WalletClient,
    concat,
    encodeAbiParameters,
    toHex
} from "viem"
import { fromZodError } from "zod-validation-error"
import type {
    VERIFYING_PAYMASTER_V06_ABI,
    VERIFYING_PAYMASTER_V07_ABI
} from "./helpers/abi"
import {
    InternalBundlerError,
    RpcError,
    jsonRpcSchema,
    pmSponsorUserOperationParamsSchema,
    returnInvalidRequestParams
} from "./helpers/schema"
import { ENTRYPOINT_ADDRESS_V06 } from "permissionless/utils"
import { isVersion06, isVersion07 } from "./helpers/utils"

const handleMethodV06 = async (
    userOperation: UserOperation<"v0.6">,
    altoBundlerV06: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>,
    verifyingPaymasterV06: GetContractReturnType<
        typeof VERIFYING_PAYMASTER_V06_ABI,
        PublicClient<Transport, Chain>
    >,
    walletClient: WalletClient<Transport, Chain, Account>,
    reply: FastifyReply,
    id: number
) => {
    const opToSimulate = {
        ...userOperation,
        paymasterAndData: concat([
            verifyingPaymasterV06.address,
            "0x000000000000000000000000000000000000000000000000000000006602f66a0000000000000000000000000000000000000000000000000000000000000000dba7a71bd49ae0174b1e4577b28f8b7c262d4085cfa192f1c19b516c85d2d1ef17eadeb549d71caf5d5f24fb6519088c1c13427343843131dd6ec19a3c6a350e1b"
        ])
    }

    let gasEstimates:
        | EstimateUserOperationGasReturnType<ENTRYPOINT_ADDRESS_V06_TYPE>
        | undefined = undefined
    try {
        gasEstimates = await altoBundlerV06.estimateUserOperationGas({
            userOperation: opToSimulate
        })
    } catch (e: unknown) {
        if (e instanceof RpcRequestError) {
            reply.status(400).send(new RpcError(e.details, e.code))
            return
        }
        reply.status(500).send(new InternalBundlerError())
        return
    }
    const op = {
        ...opToSimulate,
        ...gasEstimates
    }
    const validAfter = 0
    const validUntil = Math.floor(Date.now() / 1000) + 6000
    op.paymasterAndData = concat([
        verifyingPaymasterV06.address,
        encodeAbiParameters(
            [
                { name: "validUntil", type: "uint48" },
                { name: "validAfter", type: "uint48" }
            ],
            [validUntil, validAfter]
        ),
        toHex(0, { size: 65 })
    ])
    const hash = await verifyingPaymasterV06.read.getHash([
        op,
        validUntil,
        validAfter
    ])
    const sig = await walletClient.signMessage({
        message: { raw: hash }
    })
    const paymasterAndData = concat([
        verifyingPaymasterV06.address,
        encodeAbiParameters(
            [
                { name: "validUntil", type: "uint48" },
                { name: "validAfter", type: "uint48" }
            ],
            [validUntil, validAfter]
        ),
        sig
    ])

    const { verificationGasLimit, preVerificationGas, callGasLimit } =
        gasEstimates

    const result = {
        preVerificationGas: toHex(preVerificationGas),
        callGasLimit: toHex(callGasLimit),
        verificationGasLimit: toHex(verificationGasLimit || 0),
        paymasterAndData
    }

    return {
        jsonrpc: "2.0",
        id,
        result
    }
}

const handleMethodV07 = async (
    userOperation: UserOperation<"v0.7">,
    altoBundlerV07: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>,
    verifyingPaymasterV07: GetContractReturnType<
        typeof VERIFYING_PAYMASTER_V07_ABI,
        PublicClient<Transport, Chain>
    >,
    walletClient: WalletClient<Transport, Chain, Account>,
    reply: FastifyReply,
    id: number
) => {
    const opToSimulate = {
        ...userOperation,
        paymaster: verifyingPaymasterV07.address,
        paymasterData:
            "0x000000000000000000000000000000000000000000000000000000006602f66a0000000000000000000000000000000000000000000000000000000000000000dba7a71bd49ae0174b1e4577b28f8b7c262d4085cfa192f1c19b516c85d2d1ef17eadeb549d71caf5d5f24fb6519088c1c13427343843131dd6ec19a3c6a350e1b" as Hex
    }

    let gasEstimates:
        | EstimateUserOperationGasReturnType<ENTRYPOINT_ADDRESS_V07_TYPE>
        | undefined = undefined
    try {
        gasEstimates = await altoBundlerV07.estimateUserOperationGas({
            userOperation: opToSimulate
        })
    } catch (e: unknown) {
        if (e instanceof RpcRequestError) {
            reply.status(400).send(new RpcError(e.details, e.code))
            return
        }
        reply.status(500).send(new InternalBundlerError())
        return
    }
    const op = {
        ...opToSimulate,
        ...gasEstimates
    }
    const validAfter = 0
    const validUntil = Math.floor(Date.now() / 1000) + 6000
    op.paymasterData = concat([
        encodeAbiParameters(
            [
                { name: "validUntil", type: "uint48" },
                { name: "validAfter", type: "uint48" }
            ],
            [validUntil, validAfter]
        ),
        toHex(0, { size: 65 })
    ])
    op.paymaster = verifyingPaymasterV07.address
    const hash = await verifyingPaymasterV07.read.getHash([
        getPackedUserOperation(op),
        validUntil,
        validAfter
    ])
    const sig = await walletClient.signMessage({
        message: { raw: hash }
    })
    const paymaster = verifyingPaymasterV07.address
    const paymasterData = concat([
        encodeAbiParameters(
            [
                { name: "validUntil", type: "uint48" },
                { name: "validAfter", type: "uint48" }
            ],
            [validUntil, validAfter]
        ),
        sig
    ])

    const {
        paymasterVerificationGasLimit,
        verificationGasLimit,
        preVerificationGas,
        callGasLimit,
        paymasterPostOpGasLimit
    } = gasEstimates

    const result = {
        preVerificationGas: toHex(preVerificationGas),
        callGasLimit: toHex(callGasLimit),
        paymasterVerificationGasLimit: toHex(
            paymasterVerificationGasLimit || 0
        ),
        paymasterPostOpGasLimit: toHex(paymasterPostOpGasLimit || 0),
        verificationGasLimit: toHex(verificationGasLimit || 0),
        paymaster,
        paymasterData
    }

    return {
        jsonrpc: "2.0",
        id,
        result
    }
}

export const createRpcHandler = (
    altoBundlerV07: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>,
    altoBundlerV06: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>,
    verifyingPaymasterV07: GetContractReturnType<
        typeof VERIFYING_PAYMASTER_V07_ABI,
        PublicClient<Transport, Chain>
    >,
    verifyingPaymasterV06: GetContractReturnType<
        typeof VERIFYING_PAYMASTER_V06_ABI,
        PublicClient<Transport, Chain>
    >,
    walletClient: WalletClient<Transport, Chain, Account>
) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        console.log(`received request: ${JSON.stringify(request.body)}`)

        const body = request.body
        const parsedBody = jsonRpcSchema.safeParse(body)
        if (!parsedBody.success) {
            returnInvalidRequestParams(
                reply,
                fromZodError(parsedBody.error).message
            )
            return
        }

        if (parsedBody.data.method === "pm_sponsorUserOperation") {
            const params = pmSponsorUserOperationParamsSchema.safeParse(
                parsedBody.data.params
            )

            if (!params.success) {
                returnInvalidRequestParams(
                    reply,
                    fromZodError(params.error).message
                )
                return
            }

            const [userOperation, entryPoint] = params.data

            if (
                entryPoint !== ENTRYPOINT_ADDRESS_V06 &&
                entryPoint !== ENTRYPOINT_ADDRESS_V07
            ) {
                returnInvalidRequestParams(reply, "Unsupported EntryPoint")
                return
            }

            if (isVersion07(userOperation)) {
                return await handleMethodV07(
                    userOperation,
                    altoBundlerV07,
                    verifyingPaymasterV07,
                    walletClient,
                    reply,
                    parsedBody.data.id
                )
            }

            if (isVersion06(userOperation)) {
                return await handleMethodV06(
                    userOperation,
                    altoBundlerV06,
                    verifyingPaymasterV06,
                    walletClient,
                    reply,
                    parsedBody.data.id
                )
            }

            reply
                .status(400)
                .send(new RpcError("Failed pm_sponsorUserOperation", 404))

            return
        }

        if (parsedBody.data.method === "pm_validateSponsorshipPolicies") {
            return {
                jsonrpc: parsedBody.data.jsonrpc,
                id: parsedBody.data.id,
                result: [
                    {
                        sponsorshipPolicyId: "sp_crazy_kangaroo",
                        data: {
                            name: "Linea Christmas Week",
                            author: "Linea",
                            icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
                            description:
                                "Linea is sponsoring the first 10 transactions for existing users between Christmas and New Year's Eve."
                        }
                    }
                ]
            }
        }

        // Endpoint not supported
        console.log("Endpoint not supported")
        reply.status(400).send(new RpcError("Endpoint not supported", 404))
    }
}
