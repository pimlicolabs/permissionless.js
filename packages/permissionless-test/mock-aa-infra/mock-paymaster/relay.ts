import util from "node:util"
import type { FastifyReply, FastifyRequest } from "fastify"
import {
    type Account,
    BaseError,
    type Chain,
    type GetContractReturnType,
    type Hex,
    type PublicClient,
    type RpcRequestError,
    type Transport,
    type WalletClient,
    concat,
    encodeAbiParameters,
    toHex
} from "viem"
import { fromZodError } from "zod-validation-error"
import {
    ENTRYPOINT_ADDRESS_V07,
    type EstimateUserOperationGasReturnType,
    getPackedUserOperation
} from "../../../permissionless"
import type { PimlicoBundlerClient } from "../../../permissionless/clients/pimlico"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    UserOperation
} from "../../../permissionless/types"
import { ENTRYPOINT_ADDRESS_V06 } from "../../../permissionless/utils"
import type {
    VERIFYING_PAYMASTER_V06_ABI,
    VERIFYING_PAYMASTER_V07_ABI
} from "./helpers/abi"
import {
    InternalBundlerError,
    type JsonRpcSchema,
    RpcError,
    UserOperationV7,
    ValidationErrors,
    jsonRpcSchema,
    pmGetPaymasterData,
    pmGetPaymasterStubDataParamsSchema,
    pmSponsorUserOperationParamsSchema
} from "./helpers/schema"
import { maxBigInt } from "./helpers/utils"

const handleMethodV06 = async (
    userOperation: UserOperation<"v0.6">,
    altoBundlerV06: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>,
    verifyingPaymasterV06: GetContractReturnType<
        typeof VERIFYING_PAYMASTER_V06_ABI,
        PublicClient<Transport, Chain>
    >,
    walletClient: WalletClient<Transport, Chain, Account>,
    estimateGas: boolean
) => {
    let op = {
        ...userOperation,
        paymasterAndData: concat([
            verifyingPaymasterV06.address,
            "0x000000000000000000000000000000000000000000000000000000006602f66a0000000000000000000000000000000000000000000000000000000000000000dba7a71bd49ae0174b1e4577b28f8b7c262d4085cfa192f1c19b516c85d2d1ef17eadeb549d71caf5d5f24fb6519088c1c13427343843131dd6ec19a3c6a350e1b"
        ])
    }

    const callGasLimit = userOperation.callGasLimit
    const verificationGasLimit = userOperation.verificationGasLimit
    const preVerificationGas = userOperation.preVerificationGas

    if (estimateGas) {
        let gasEstimates:
            | EstimateUserOperationGasReturnType<ENTRYPOINT_ADDRESS_V06_TYPE>
            | undefined = undefined
        try {
            gasEstimates = await altoBundlerV06.estimateUserOperationGas({
                userOperation: op
            })
        } catch (e: unknown) {
            if (!(e instanceof BaseError)) throw new InternalBundlerError()
            const err = e.walk() as RpcRequestError
            throw err
        }

        op = {
            ...op,
            ...gasEstimates
        }

        op.callGasLimit = maxBigInt(op.callGasLimit, callGasLimit)
        op.preVerificationGas = maxBigInt(
            op.preVerificationGas,
            preVerificationGas
        )
        op.verificationGasLimit = maxBigInt(
            op.verificationGasLimit,
            verificationGasLimit
        )
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

    const result = {
        preVerificationGas: toHex(op.preVerificationGas),
        callGasLimit: toHex(op.callGasLimit),
        verificationGasLimit: toHex(op.verificationGasLimit || 0),
        paymasterAndData
    }

    return result
}

const handleMethodV07 = async (
    userOperation: UserOperation<"v0.7">,
    altoBundlerV07: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>,
    verifyingPaymasterV07: GetContractReturnType<
        typeof VERIFYING_PAYMASTER_V07_ABI,
        PublicClient<Transport, Chain>
    >,
    walletClient: WalletClient<Transport, Chain, Account>,
    estimateGas: boolean
) => {
    let op = {
        ...userOperation,
        paymaster: verifyingPaymasterV07.address,
        paymasterData:
            "0x000000000000000000000000000000000000000000000000000000006602f66a0000000000000000000000000000000000000000000000000000000000000000dba7a71bd49ae0174b1e4577b28f8b7c262d4085cfa192f1c19b516c85d2d1ef17eadeb549d71caf5d5f24fb6519088c1c13427343843131dd6ec19a3c6a350e1b" as Hex
    }

    const callGasLimit = userOperation.callGasLimit
    const verificationGasLimit = userOperation.verificationGasLimit
    const preVerificationGas = userOperation.preVerificationGas

    if (estimateGas) {
        let gasEstimates:
            | EstimateUserOperationGasReturnType<ENTRYPOINT_ADDRESS_V07_TYPE>
            | undefined = undefined
        try {
            gasEstimates = await altoBundlerV07.estimateUserOperationGas({
                userOperation: op
            })
        } catch (e: unknown) {
            if (!(e instanceof BaseError)) throw new InternalBundlerError()
            const err = e.walk() as RpcRequestError
            throw err
        }

        op = {
            ...op,
            ...gasEstimates
        }

        op.callGasLimit = maxBigInt(op.callGasLimit, callGasLimit)
        op.preVerificationGas = maxBigInt(
            op.preVerificationGas,
            preVerificationGas
        )
        op.verificationGasLimit = maxBigInt(
            op.verificationGasLimit,
            verificationGasLimit
        )
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

    const result = {
        preVerificationGas: toHex(op.preVerificationGas),
        callGasLimit: toHex(op.callGasLimit),
        paymasterVerificationGasLimit: toHex(
            op.paymasterVerificationGasLimit || 0
        ),
        paymasterPostOpGasLimit: toHex(op.paymasterPostOpGasLimit || 0),
        verificationGasLimit: toHex(op.verificationGasLimit || 0),
        paymaster,
        paymasterData
    }

    return result
}

const handleMethod = async (
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
    walletClient: WalletClient<Transport, Chain, Account>,
    parsedBody: JsonRpcSchema
) => {
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

        if (entryPoint === ENTRYPOINT_ADDRESS_V07) {
            return await handleMethodV07(
                userOperation as UserOperation<"v0.7">,
                altoBundlerV07,
                verifyingPaymasterV07,
                walletClient,
                true
            )
        }

        if (entryPoint === ENTRYPOINT_ADDRESS_V06) {
            return await handleMethodV06(
                userOperation as UserOperation<"v0.6">,
                altoBundlerV06,
                verifyingPaymasterV06,
                walletClient,
                true
            )
        }

        throw new RpcError(
            "EntryPoint not supported",
            ValidationErrors.InvalidFields
        )
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

        const [, entryPoint] = params.data

        if (entryPoint === ENTRYPOINT_ADDRESS_V07) {
            return {
                paymaster: verifyingPaymasterV07.address,
                paymasterData:
                    "0x00000000000000000000000000000000000000000000000000000101010101010000000000000000000000000000000000000000000000000000000000000000cd91f19f0f19ce862d7bec7b7d9b95457145afc6f639c28fd0360f488937bfa41e6eedcd3a46054fd95fcd0e3ef6b0bc0a615c4d975eef55c8a3517257904d5b1c",
                paymasterVerificationGasLimit: toHex(50_000n),
                paymasterPostOpGasLimit: toHex(20_000n)
            }
        }

        if (entryPoint === ENTRYPOINT_ADDRESS_V06) {
            return {
                paymasterAndData: `${verifyingPaymasterV06.address}00000000000000000000000000000000000000000000000000000101010101010000000000000000000000000000000000000000000000000000000000000000cd91f19f0f19ce862d7bec7b7d9b95457145afc6f639c28fd0360f488937bfa41e6eedcd3a46054fd95fcd0e3ef6b0bc0a615c4d975eef55c8a3517257904d5b1c`
            }
        }

        throw new RpcError(
            "EntryPoint not supported",
            ValidationErrors.InvalidFields
        )
    }

    if (parsedBody.method === "pm_getPaymasterData") {
        const params = pmGetPaymasterData.safeParse(parsedBody.params)

        if (!params.success) {
            throw new RpcError(
                fromZodError(params.error).message,
                ValidationErrors.InvalidFields
            )
        }

        const [userOperation, entryPoint] = params.data

        if (entryPoint === ENTRYPOINT_ADDRESS_V07) {
            return await handleMethodV07(
                userOperation as UserOperation<"v0.7">,
                altoBundlerV07,
                verifyingPaymasterV07,
                walletClient,
                false
            )
        }

        if (entryPoint === ENTRYPOINT_ADDRESS_V06) {
            return await handleMethodV06(
                userOperation as UserOperation<"v0.6">,
                altoBundlerV06,
                verifyingPaymasterV06,
                walletClient,
                false
            )
        }

        throw new RpcError(
            "EntryPoint not supported",
            ValidationErrors.InvalidFields
        )
    }

    if (parsedBody.method === "pm_validateSponsorshipPolicies") {
        return [
            {
                sponsorshipPolicyId: "sp_crazy_kangaroo",
                data: {
                    name: "Free ops for devs",
                    author: "foo",
                    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
                    description: "Free userOps :)"
                }
            }
        ]
    }

    throw new RpcError(
        "Attempted to call an unknown method",
        ValidationErrors.InvalidFields
    )
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
            const result = await handleMethod(
                altoBundlerV07,
                altoBundlerV06,
                verifyingPaymasterV07,
                verifyingPaymasterV06,
                walletClient,
                parsedBody.data
            )

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
