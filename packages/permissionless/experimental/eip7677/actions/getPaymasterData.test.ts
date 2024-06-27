import { zeroAddress } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPimlicoPaymasterClient,
    getSimpleAccountClient
} from "../../../../permissionless-test/src/utils"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../../utils"
import { paymasterActionsEip7677 } from "../clients/decorators/paymasterActionsEip7677"
import { foundry } from "viem/chains"
import { UserOperation } from "../../../types/userOperation"

describe("EIP-7677 getPaymasterData", () => {
    testWithRpc("getPaymasterData_V06", async ({ rpc }) => {
        const { anvilRpc, altoRpc, paymasterRpc } = rpc

        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            privateKey: generatePrivateKey(),
            altoRpc: altoRpc,
            anvilRpc: anvilRpc
        })

        const pimlicoPaymasterClient = getPimlicoPaymasterClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            paymasterRpc
        }).extend(paymasterActionsEip7677(ENTRYPOINT_ADDRESS_V06))

        let userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        data: "0x",
                        value: 0n
                    })
                }
            })

        const paymasterData = await pimlicoPaymasterClient.getPaymasterData({
            userOperation,
            chain: foundry
        })
        expect(paymasterData).not.toBeNull()
        expect(paymasterData?.paymasterAndData).not.toBeNull()

        // test that smart account can send op with the returned values
        const bundlerClient = getBundlerClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            altoRpc
        })

        userOperation = {
            ...userOperation,
            ...paymasterData
        }
        userOperation.signature =
            await simpleAccountClient.account.signUserOperation(userOperation)

        const hash = await bundlerClient.sendUserOperation({
            userOperation
        })

        const receipt = await bundlerClient.waitForUserOperationReceipt({
            hash
        })
        expect(receipt.success).toBeTruthy()
    })

    testWithRpc("getPaymasterData_V07", async ({ rpc }) => {
        const { anvilRpc, altoRpc, paymasterRpc } = rpc

        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            privateKey: generatePrivateKey(),
            altoRpc: altoRpc,
            anvilRpc: anvilRpc
        })

        const pimlicoPaymasterClient = getPimlicoPaymasterClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            paymasterRpc
        }).extend(paymasterActionsEip7677(ENTRYPOINT_ADDRESS_V07))

        let userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        data: "0x",
                        value: 0n
                    })
                }
            })

        userOperation.paymasterPostOpGasLimit = 150_000n
        userOperation.paymasterVerificationGasLimit = 650_000n

        const paymasterData = await pimlicoPaymasterClient.getPaymasterData({
            // @ts-ignore
            userOperation,
            chain: foundry
        })
        expect(paymasterData).not.toBeNull()
        expect(paymasterData?.paymaster).not.toBeNull()
        expect(paymasterData?.paymasterData).not.toBeNull()

        // test that smart account can send op with the returned values
        const bundlerClient = getBundlerClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            altoRpc
        })

        userOperation = {
            ...userOperation,
            ...paymasterData
        } as UserOperation<"v0.7">
        userOperation.signature =
            await simpleAccountClient.account.signUserOperation(userOperation)

        const hash = await bundlerClient.sendUserOperation({
            userOperation
        })

        const receipt = await bundlerClient.waitForUserOperationReceipt({
            hash
        })
        expect(receipt.success).toBeTruthy()
    })
})
