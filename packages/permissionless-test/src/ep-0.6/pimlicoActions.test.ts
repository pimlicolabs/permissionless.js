import type { PimlicoBundlerClient } from "permissionless/clients/pimlico"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    UserOperation
} from "permissionless/types"
import { ENTRYPOINT_ADDRESS_V06 } from "permissionless/utils"
import {
    type Chain,
    type PublicClient,
    type Transport,
    isHash,
    isHex
} from "viem"
import { beforeAll, describe, expect, test } from "vitest"
import {
    ensureBundlerIsReady,
    ensurePaymasterIsReady,
    fund,
    getPimlicoBundlerClient,
    getPimlicoPaymasterClient,
    getPublicClient,
    getSimpleAccountClient
} from "../utils"

describe("Pimlico Actions tests", () => {
    let publicClient: PublicClient<Transport, Chain>
    let pimlicoBundlerClient: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>

    beforeAll(async () => {
        publicClient = getPublicClient()
        pimlicoBundlerClient = getPimlicoBundlerClient(ENTRYPOINT_ADDRESS_V06)

        await ensureBundlerIsReady()
        await ensurePaymasterIsReady()
    })

    describe("Pimlico Bundler actions", () => {
        test("can fetch gas price", async () => {
            const gasPrice =
                await pimlicoBundlerClient.getUserOperationGasPrice()

            expect(gasPrice).toBeTruthy()
            expect(gasPrice.slow).toBeTruthy()
            expect(gasPrice.standard).toBeTruthy()
            expect(gasPrice.fast).toBeTruthy()
            expect(typeof gasPrice.slow.maxFeePerGas).toBe("bigint")
            expect(gasPrice.slow.maxFeePerGas).toBeGreaterThan(0n)
            expect(typeof gasPrice.slow.maxPriorityFeePerGas).toBe("bigint")
            expect(gasPrice.slow.maxPriorityFeePerGas).toBeGreaterThan(0n)
            expect(typeof gasPrice.standard.maxFeePerGas).toBe("bigint")
            expect(gasPrice.standard.maxFeePerGas).toBeGreaterThan(0n)
            expect(typeof gasPrice.standard.maxPriorityFeePerGas).toBe("bigint")
            expect(gasPrice.standard.maxPriorityFeePerGas).toBeGreaterThan(0n)
            expect(typeof gasPrice.fast.maxFeePerGas).toBe("bigint")
            expect(gasPrice.fast.maxFeePerGas).toBeGreaterThan(0n)
            expect(typeof gasPrice.fast.maxPriorityFeePerGas).toBe("bigint")
            expect(gasPrice.fast.maxPriorityFeePerGas).toBeGreaterThan(0n)
        })
        test("fetch user operation status", async () => {})
    })

    describe("Pimlico paymaster actions ", () => {
        test("can fetch paymasterAndData", async () => {
            const { maxFeePerGas, maxPriorityFeePerGas } =
                await publicClient.estimateFeesPerGas()

            const simpleAccountClient = await getSimpleAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06
            })

            await fund(simpleAccountClient.account.address)

            const partialUserOp =
                await simpleAccountClient.prepareUserOperationRequest({
                    userOperation: {
                        callData:
                            await simpleAccountClient.account.encodeCallData({
                                to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                                data: "0x",
                                value: 0n
                            })
                    }
                })

            const userOperation: UserOperation<"v0.6"> = {
                ...partialUserOp,
                maxFeePerGas: maxFeePerGas || 0n,
                maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
                callGasLimit: 0n,
                verificationGasLimit: 0n,
                preVerificationGas: 0n
            }

            const pimlicoPaymasterClient = getPimlicoPaymasterClient(
                ENTRYPOINT_ADDRESS_V06
            )

            const result = await pimlicoPaymasterClient.sponsorUserOperation({
                userOperation
            })

            expect(result).toBeTruthy()
            expect(typeof result.callGasLimit).toBe("bigint")
            expect(result.callGasLimit).toBeGreaterThan(0n)
            expect(typeof result.preVerificationGas).toBe("bigint")
            expect(result.preVerificationGas).toBeGreaterThan(0n)
            expect(typeof result.verificationGasLimit).toBe("bigint")
            expect(result.verificationGasLimit).toBeGreaterThan(0n)
            expect(result.paymasterAndData.length).toBeGreaterThan(0)
            expect(isHex(result.paymasterAndData)).toBe(true)
        }, 100000)

        test("can send userOperation with paymaster and data", async () => {
            const smartClient = await getSimpleAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                paymasterClient: getPimlicoPaymasterClient(
                    ENTRYPOINT_ADDRESS_V06
                )
            })
            const smartAccount = smartClient.account

            const op = await smartClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await smartAccount.encodeCallData({
                        to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                        data: "0x",
                        value: 0n
                    })
                }
            })

            op.signature = await smartAccount.signUserOperation(op)

            const userOpHash = await pimlicoBundlerClient.sendUserOperation({
                userOperation: op
            })
            expect(isHash(userOpHash)).toBe(true)

            const userOperationReceipt =
                await pimlicoBundlerClient.waitForUserOperationReceipt({
                    hash: userOpHash
                })
            expect(userOperationReceipt).not.toBeNull()
            expect(userOperationReceipt?.userOpHash).toBe(userOpHash)
            expect(
                userOperationReceipt?.receipt.transactionHash.length
            ).toBeGreaterThan(0)
            expect(userOperationReceipt?.receipt.transactionHash).not.toBeNull()
            expect(
                userOperationReceipt?.receipt.transactionHash
            ).not.toBeUndefined()
            const userOperationFromUserOpHash =
                await pimlicoBundlerClient.getUserOperationByHash({
                    hash: userOpHash
                })
            expect(userOperationFromUserOpHash).not.toBeNull()
            expect(userOperationFromUserOpHash?.entryPoint).toBe(
                ENTRYPOINT_ADDRESS_V06
            )
            expect(userOperationFromUserOpHash?.transactionHash).toBe(
                userOperationReceipt?.receipt.transactionHash
            )

            const userOperationStatus =
                await pimlicoBundlerClient.getUserOperationStatus({
                    hash: userOpHash
                })
            expect(userOperationStatus).not.toBeNull()
            expect(userOperationStatus).not.toBeUndefined()
            expect(userOperationStatus.status).toBe("included")
            expect(userOperationStatus.transactionHash).toBe(
                userOperationReceipt?.receipt.transactionHash
            )
        }, 100000)
    })

    test("Validating sponsorship policies", async () => {
        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06)
        })

        const userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                        data: "0x",
                        value: 0n
                    })
                }
            })

        const pimlicoPaymasterClient = getPimlicoPaymasterClient(
            ENTRYPOINT_ADDRESS_V06
        )

        const validateSponsorshipPolicies =
            await pimlicoPaymasterClient.validateSponsorshipPolicies({
                userOperation: userOperation,
                sponsorshipPolicyIds: ["sp_crazy_kangaroo"]
            })

        expect(validateSponsorshipPolicies).toBeTruthy()
        expect(validateSponsorshipPolicies.length).toBeGreaterThan(0)
        expect(Array.isArray(validateSponsorshipPolicies)).toBe(true)
        expect(validateSponsorshipPolicies.length).toBe(1)
    }, 100000)

    test("create simulateHandleOp callData", async () => {
        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06)
        })

        const userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                        data: "0x",
                        value: 0n
                    })
                }
            })

        const result = pimlicoBundlerClient.buildSimulateUserOperationCall({
            userOperation
        })

        expect(result.to).toBe(ENTRYPOINT_ADDRESS_V06)
        expect(result.data).toBeTruthy()
    })
})
