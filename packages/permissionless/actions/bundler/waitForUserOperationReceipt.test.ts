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

describe("waitForUserOperationReceipt", () => {
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

    test("waitForUserOperationReceipt_V06", async () => {
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

        const userOperationReceipt =
            await bundlerClientV06.waitForUserOperationReceipt({
                hash: opHash
            })
        expect(userOperationReceipt).not.toBeNull()
        expect(userOperationReceipt?.userOpHash).toBe(opHash)
        expect(userOperationReceipt?.receipt.transactionHash).toBeTruthy()

        const receipt = await bundlerClientV06.getUserOperationReceipt({
            hash: opHash
        })

        expect(receipt?.receipt.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )
    })

    test("waitForUserOperationReceipt_V07", async () => {
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

        const userOperationReceipt =
            await bundlerClientV07.waitForUserOperationReceipt({
                hash: opHash
            })
        expect(userOperationReceipt).not.toBeNull()
        expect(userOperationReceipt?.userOpHash).toBe(opHash)
        expect(userOperationReceipt?.receipt.transactionHash).toBeTruthy()

        const receipt = await bundlerClientV07.getUserOperationReceipt({
            hash: opHash
        })

        expect(receipt?.receipt.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )
    })
})
