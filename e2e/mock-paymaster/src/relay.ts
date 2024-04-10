import type { FastifyReply, FastifyRequest } from "fastify"
import {
    ENTRYPOINT_ADDRESS_V07,
    type EstimateUserOperationGasReturnType
} from "permissionless"
import type { PimlicoBundlerClient } from "permissionless/clients/pimlico"
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types"
import {
    type Hex,
    RpcRequestError,
    concat,
    encodeAbiParameters,
    toHex,
    type WalletClient,
    type GetContractReturnType,
    type Transport,
    type Account,
    type Chain,
    type PublicClient
} from "viem"
import { toPackedUserOperation } from "./helpers/utils"
import { fromZodError } from "zod-validation-error"
import {
    InternalBundlerError,
    RpcError,
    jsonRpcSchema,
    pmSponsorUserOperationParamsSchema,
    returnInvalidRequestParams
} from "./helpers/schema"
import type { VERIFYING_PAYMASTER_V07_ABI } from "./helpers/abi"

export const createRpcHandler = (
    altoBundler: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>,
    verifyingPaymasterV07: GetContractReturnType<
        typeof VERIFYING_PAYMASTER_V07_ABI,
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
            if (entryPoint !== ENTRYPOINT_ADDRESS_V07) {
                returnInvalidRequestParams(reply, "Unsupported EntryPoint")
                return
            }
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
                gasEstimates = await altoBundler.estimateUserOperationGas({
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
                toPackedUserOperation(op),
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
            const returnResult = {
                jsonrpc: parsedBody.data.jsonrpc,
                id: parsedBody.data.id,
                result
            }
            console.log(`received request: ${JSON.stringify(request.body)}`)
            return returnResult
        }
        try {
            // else forward it to alto bundler
            return await altoBundler.request({
                // @ts-ignore
                method: parsedBody.data.method,
                // @ts-ignore
                params: parsedBody.data.params
            })
        } catch (e: unknown) {
            if (e instanceof RpcRequestError) {
                reply.status(400).send(new RpcError(e.details, e.code))
                return
            }
            reply.status(500).send(new InternalBundlerError())
            return
        }
    }
}
