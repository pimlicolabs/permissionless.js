import { http } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { beforeAll, describe, expect, test } from "vitest"
import {
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

describe.sequential("eth_estimateUserOperationGas", () => {
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

    test("eth_estimateUserOperationGas_v06", async () => {
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
                        to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                        data: "0x",
                        value: 0n
                    })
                }
            })

        const { preVerificationGas, verificationGasLimit, callGasLimit } =
            await bundlerClientV06.estimateUserOperationGas({
                userOperation
            })

        expect(preVerificationGas).toBeTruthy()
        expect(verificationGasLimit).toBeTruthy()
        expect(callGasLimit).toBeTruthy()
    })

    test("eth_estimateUserOperationGas_v07", async () => {
        const smartAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            privateKey: generatePrivateKey(),
            altoRpc: altoRpc,
            anvilRpc: anvilRpc
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

        const {
            preVerificationGas,
            verificationGasLimit,
            callGasLimit,
            paymasterVerificationGasLimit,
            paymasterPostOpGasLimit
        } = await bundlerClientV07.estimateUserOperationGas({
            userOperation
        })

        expect(preVerificationGas).toBeTruthy()
        expect(verificationGasLimit).toBeTruthy()
        expect(callGasLimit).toBeTruthy()
        expect(paymasterVerificationGasLimit).toBe(0n)
        expect(paymasterPostOpGasLimit).toBe(0n)
    }, 100000)
})
