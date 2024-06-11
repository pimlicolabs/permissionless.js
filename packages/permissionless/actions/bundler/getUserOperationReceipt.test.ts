import type { Instance } from "prool"
import { http, isHash, zeroAddress } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import {
    fund,
    getPimlicoPaymasterClient,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"
import {
    type BundlerClient,
    createBundlerClient
} from "../../clients/createBundlerClient"
import { anvilPort, getPortsForTest } from "../../setupTests"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE
} from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"

describe.sequential("getUserOperationReceipt", () => {
    let bundlerClientV06: BundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>
    let bundlerClientV07: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>
    let anvilRpc: string
    let altoRpc: string
    let paymasterRpc: string

    beforeAll(async () => {
        const { altoPort, paymasterPort } = getPortsForTest("bundlerActions")
        anvilRpc = `http://localhost:${anvilPort}/${altoPort}`
        altoRpc = `http://localhost:${altoPort}`
        paymasterRpc = `http://localhost:${paymasterPort}`

        bundlerClientV06 = createBundlerClient({
            transport: http(altoRpc),
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        bundlerClientV07 = createBundlerClient({
            transport: http(altoRpc),
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })
    })

    test("getUserOperationReceipt_V06", async () => {
        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            privateKey: generatePrivateKey(),
            altoRpc: altoRpc,
            anvilRpc: anvilRpc,
            paymasterClient: getPimlicoPaymasterClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                paymasterRpc
            })
        })

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
                hash: opHash,
                timeout: 100000
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

    test("getUserOperationReceipt_V07", async () => {
        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            privateKey: generatePrivateKey(),
            altoRpc: altoRpc,
            anvilRpc: anvilRpc,
            paymasterClient: getPimlicoPaymasterClient({
                entryPoint: ENTRYPOINT_ADDRESS_V07,
                paymasterRpc
            })
        })

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
                hash: opHash,
                timeout: 100000
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
