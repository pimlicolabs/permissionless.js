import { http, parseEther } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getPimlicoPaymasterClient,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"
import { createBundlerClient } from "../../clients/createBundlerClient"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"

describe("eth_estimateUserOperationGas", () => {
    testWithRpc("eth_estimateUserOperationGas_v06", async ({ rpc }) => {
        const { anvilRpc, altoRpc, paymasterRpc } = rpc

        const bundlerClientV06 = createBundlerClient({
            transport: http(altoRpc),
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

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
            await bundlerClientV06.estimateUserOperationGas(
                {
                    userOperation
                },
                {
                    "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC": {
                        balance: parseEther("1"),
                        stateDiff: {
                            "0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0":
                                "0x00000000000000000000000000000000000000000000000000000000000001a4"
                        }
                    }
                }
            )

        expect(preVerificationGas).toBeTruthy()
        expect(verificationGasLimit).toBeTruthy()
        expect(callGasLimit).toBeTruthy()
    })

    testWithRpc("eth_estimateUserOperationGas_v07", async ({ rpc }) => {
        const { anvilRpc, altoRpc, paymasterRpc } = rpc
        const bundlerClientV07 = createBundlerClient({
            transport: http(altoRpc),
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

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
    })

    testWithRpc(
        "eth_estimateUserOperationGas_V07_with_error",
        async ({ rpc }) => {
            const { anvilRpc, altoRpc, paymasterRpc } = rpc
            const bundlerClientV07 = createBundlerClient({
                transport: http(altoRpc),
                entryPoint: ENTRYPOINT_ADDRESS_V07
            })

            const smartAccountClient = await getSimpleAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V07,
                privateKey: generatePrivateKey(),
                altoRpc: altoRpc,
                anvilRpc: anvilRpc
            })

            const userOperation =
                await smartAccountClient.prepareUserOperationRequest({
                    userOperation: {
                        callData:
                            await smartAccountClient.account.encodeCallData({
                                to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                                data: "0x",
                                value: 1000n
                            })
                    }
                })

            await expect(() =>
                bundlerClientV07.estimateUserOperationGas(
                    {
                        userOperation
                    },
                    {
                        [smartAccountClient.account.address]: {
                            balance: 0n
                        }
                    }
                )
            ).rejects.toThrowError(/AA21/)
        }
    )

    testWithRpc(
        "eth_estimateUserOperationGas_V07_withPaymaster",
        async ({ rpc }) => {
            const { anvilRpc, altoRpc, paymasterRpc } = rpc
            const bundlerClientV07 = createBundlerClient({
                transport: http(altoRpc),
                entryPoint: ENTRYPOINT_ADDRESS_V07
            })

            const smartAccountClient = await getSimpleAccountClient({
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
                await smartAccountClient.prepareUserOperationRequest({
                    userOperation: {
                        callData:
                            await smartAccountClient.account.encodeCallData({
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
            expect(paymasterVerificationGasLimit).toBeTruthy()
            expect(paymasterPostOpGasLimit).toBeTruthy()
        }
    )
})
