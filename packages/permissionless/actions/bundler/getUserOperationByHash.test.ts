import { isHash, zeroAddress } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
    fund,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"
import type { BundlerClient } from "../../clients/createBundlerClient"
import {
    anvilPort,
    getPortForTestName,
    startAltoInstance
} from "../../setupTests"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE
} from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"

describe("getUserOperationByHash", () => {
    let port: number
    let bundlerClientV06: BundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>
    let bundlerClientV07: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>
    let anvilRpc: string
    let altoRpc: string

    beforeAll(async () => {
        port = await getPortForTestName("bundlerActions")
        anvilRpc = `http://localhost:${anvilPort}/${port}`
        altoRpc = `http://localhost:${port}`
        bundlerClientV06 = await startAltoInstance({
            port,
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })
        bundlerClientV07 = await startAltoInstance({
            port,
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })
    })

    test("getUserOperationByHash_V06", async () => {
        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            privateKey: generatePrivateKey(),
            altoRpc: altoRpc,
            anvilRpc: anvilRpc
        })

        await fund({ to: simpleAccountClient.account.address, anvilRpc })

        const userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        data: "0x",
                        value: 0n
                    })
                }
            })

        userOperation.signature =
            await simpleAccountClient.account.signUserOperation(userOperation)

        const opHash = await bundlerClientV06.sendUserOperation({
            userOperation
        })

        expect(isHash(opHash)).toBe(true)

        await bundlerClientV06.waitForUserOperationReceipt({
            hash: opHash
        })

        const userOperationFromUserOpHash =
            await bundlerClientV06.getUserOperationByHash({ hash: opHash })

        expect(userOperationFromUserOpHash).not.toBeNull()
        expect(userOperationFromUserOpHash?.entryPoint).toBe(
            ENTRYPOINT_ADDRESS_V06
        )

        for (const key in userOperationFromUserOpHash?.userOperation) {
            const expected = userOperationFromUserOpHash?.userOperation[key]
            const actual = userOperation[key]

            if (typeof expected === "string" && typeof actual === "string") {
                expect(expected.toLowerCase()).toBe(actual.toLowerCase())
            } else {
                expect(expected).toBe(actual)
            }
        }
    })

    test("getUserOperationByHash_V07", async () => {
        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            privateKey: generatePrivateKey(),
            altoRpc: altoRpc,
            anvilRpc: anvilRpc
        })

        await fund({ to: simpleAccountClient.account.address, anvilRpc })

        const userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        data: "0x",
                        value: 0n
                    })
                }
            })

        userOperation.signature =
            await simpleAccountClient.account.signUserOperation(userOperation)

        const opHash = await bundlerClientV07.sendUserOperation({
            userOperation
        })

        expect(isHash(opHash)).toBe(true)

        await bundlerClientV07.waitForUserOperationReceipt({ hash: opHash })

        const userOperationFromUserOpHash =
            await bundlerClientV07.getUserOperationByHash({ hash: opHash })

        expect(userOperationFromUserOpHash).not.toBeNull()
        expect(userOperationFromUserOpHash?.entryPoint).toBe(
            ENTRYPOINT_ADDRESS_V07
        )

        expect(
            userOperationFromUserOpHash?.userOperation.sender.toLowerCase()
        ).toBe(userOperation.sender.toLowerCase())
        expect(userOperationFromUserOpHash?.userOperation.nonce).toBe(
            userOperation.nonce
        )
        expect(
            userOperationFromUserOpHash?.userOperation.factory?.toLowerCase()
        ).toBe(userOperation.factory?.toLowerCase())
        expect(
            userOperationFromUserOpHash?.userOperation.factoryData?.toLowerCase()
        ).toBe(userOperation.factoryData?.toLowerCase())
        expect(
            userOperationFromUserOpHash?.userOperation.callData.toLowerCase()
        ).toBe(userOperation.callData.toLowerCase())
        expect(userOperationFromUserOpHash?.userOperation.callGasLimit).toBe(
            userOperation.callGasLimit
        )
        expect(
            userOperationFromUserOpHash?.userOperation.verificationGasLimit
        ).toBe(userOperation.verificationGasLimit)
        expect(
            userOperationFromUserOpHash?.userOperation.preVerificationGas
        ).toBe(userOperation.preVerificationGas)
        expect(userOperationFromUserOpHash?.userOperation.maxFeePerGas).toBe(
            userOperation.maxFeePerGas
        )
        expect(
            userOperationFromUserOpHash?.userOperation.maxPriorityFeePerGas
        ).toBe(userOperation.maxPriorityFeePerGas)
        expect(
            userOperationFromUserOpHash?.userOperation.signature.toLowerCase()
        ).toBe(userOperation.signature.toLowerCase())
        expect(
            userOperationFromUserOpHash?.userOperation.paymaster?.toLowerCase()
        ).toBe(userOperation.paymaster?.toLowerCase())
        expect(
            userOperationFromUserOpHash?.userOperation
                .paymasterVerificationGasLimit
        ).toBe(userOperation.paymasterVerificationGasLimit)
        expect(
            userOperationFromUserOpHash?.userOperation.paymasterPostOpGasLimit
        ).toBe(undefined)
        expect(
            userOperationFromUserOpHash?.userOperation.paymasterData?.toLowerCase()
        ).toBe(userOperation.paymasterData?.toLowerCase())
    })
})
