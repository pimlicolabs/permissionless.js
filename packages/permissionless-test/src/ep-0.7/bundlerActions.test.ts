import {
    type BundlerClient,
    ENTRYPOINT_ADDRESS_V07,
    type UserOperation,
    WaitForUserOperationReceiptTimeoutError,
    getUserOperationHash
} from "permissionless"
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types"
import { type Chain, isHash } from "viem"
import { foundry } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import {
    ensureBundlerIsReady,
    ensurePaymasterIsReady,
    fund,
    getBundlerClient,
    getPimlicoPaymasterClient,
    getSimpleAccountClient
} from "../utils"

describe("v0.7 Bundler Actions", () => {
    let bundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE, Chain>

    beforeAll(async () => {
        bundlerClient = getBundlerClient(ENTRYPOINT_ADDRESS_V07)

        await ensureBundlerIsReady()
        await ensurePaymasterIsReady()
    })

    test("Supports eth_supportedEntryPoints", async () => {
        const supportedEntryPoints = await bundlerClient.supportedEntryPoints()

        expect(Array.isArray(supportedEntryPoints))
        expect(supportedEntryPoints.length).toBeGreaterThan(0)
        expect(supportedEntryPoints.includes(ENTRYPOINT_ADDRESS_V07))
    })

    test("Supports eth_chainId", async () => {
        const chainId = await bundlerClient.chainId()

        expect(chainId).toBe(foundry.id)
        expect(chainId).toBeGreaterThan(0)
        expect(chainId === foundry.id)
    })

    test("Supports eth_estimateUserOperationGas", async () => {
        const smartAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V07)
        })

        const userOperation =
            (await smartAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await smartAccountClient.account.encodeCallData({
                        to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                        data: "0x",
                        value: 0n
                    })
                }
            })) as UserOperation<"v0.7">

        const {
            preVerificationGas,
            verificationGasLimit,
            callGasLimit,
            paymasterVerificationGasLimit,
            paymasterPostOpGasLimit
        } = await bundlerClient.estimateUserOperationGas({
            userOperation
        })

        expect(preVerificationGas).toBeTruthy()
        expect(verificationGasLimit).toBeTruthy()
        expect(callGasLimit).toBeTruthy()
        expect(paymasterVerificationGasLimit).toBeTruthy()
        expect(paymasterPostOpGasLimit).toBeTruthy()
    }, 100000)

    test("Supports eth_sendUserOperation", async () => {
        const smartAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        await fund(smartAccountClient.account.address)

        const op = await smartAccountClient.prepareUserOperationRequest({
            userOperation: {
                callData: await smartAccountClient.account.encodeCallData({
                    to: "0x1111111111111111111111111111111111111111",
                    data: "0x",
                    value: 0n
                })
            }
        })
        op.signature = await smartAccountClient.account.signUserOperation(op)

        const opHash = await bundlerClient.sendUserOperation({
            userOperation: op
        })

        expect(isHash(opHash)).toBe(true)

        const userOperationReceipt =
            await bundlerClient.waitForUserOperationReceipt({
                hash: opHash
            })

        expect(userOperationReceipt).not.toBeNull()
        expect(userOperationReceipt?.userOpHash).toBe(opHash)
        expect(userOperationReceipt?.receipt.transactionHash).toBeTruthy()

        const receipt = await bundlerClient.getUserOperationReceipt({
            hash: opHash
        })

        expect(receipt?.receipt.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )

        //await new Promise((resolve) => setTimeout(resolve, 1000))

        //const userOperationFromUserOpHash =
        //    await bundlerClient.getUserOperationByHash({ hash: opHash })

        //expect(userOperationFromUserOpHash).not.toBeNull()
        //expect(userOperationFromUserOpHash?.entryPoint).toBe(
        //    ENTRYPOINT_ADDRESS_V07
        //)
        //expect(userOperationFromUserOpHash?.transactionHash).toBe(
        //    userOperationReceipt?.receipt.transactionHash
        //)

        //for (const key in userOperationFromUserOpHash?.userOperation) {
        //    expect(userOperationFromUserOpHash?.userOperation[key]).toBe(
        //        op[key]
        //    )
        //}
    }, 100000)

    test("Should handle eth_sendUserOperation failures", async () => {
        const smartAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        const userOperation =
            await smartAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await smartAccountClient.account.encodeCallData({
                        to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                        data: "0x",
                        value: 0n
                    })
                }
            })

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            userOperation
        })

        userOperation.callGasLimit = gasParameters.callGasLimit
        userOperation.verificationGasLimit = gasParameters.verificationGasLimit
        userOperation.preVerificationGas = gasParameters.preVerificationGas

        const userOpHash = getUserOperationHash({
            userOperation,
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            chainId: foundry.id
        })

        await expect(
            bundlerClient.waitForUserOperationReceipt({
                hash: userOpHash,
                timeout: 100
            })
        ).rejects.toThrow(WaitForUserOperationReceiptTimeoutError)
    })
})
