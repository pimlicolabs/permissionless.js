import { zeroAddress } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../../permissionless-test/src/testWithRpc"
import {
    getPimlicoPaymasterClient,
    getSimpleAccountClient
} from "../../../../permissionless-test/src/utils"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../../utils"
import { paymasterActionsEip7677 } from "../clients/decorators/paymasterActionsEip7677"

describe("EIP-7677 getPaymasterStubData", () => {
    testWithRpc("getPaymasterStubData_V06", async ({ rpc }) => {
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

        const stubData = await pimlicoPaymasterClient.getPaymasterStubData({
            userOperation,
            chain: foundry
        })
        expect(stubData).not.toBeNull()
        expect(stubData?.paymasterAndData).not.toBeNull()
        expect(stubData?.isFinal).toBe(false)
        expect(stubData?.sponsor?.icon).toBeTruthy()
        expect(stubData?.sponsor?.name).toBe("Pimlico")
    })

    testWithRpc("getPaymasterStubData_V07", async ({ rpc }) => {
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

        const stubData = await pimlicoPaymasterClient.getPaymasterStubData({
            userOperation,
            chain: foundry
        })
        expect(stubData).not.toBeNull()
        expect(stubData?.paymaster).not.toBeNull()
        expect(stubData?.paymasterData).not.toBeNull()
        expect(stubData?.paymasterPostOpGasLimit).not.toBeNull()
        expect(stubData?.paymasterVerificationGasLimit).not.toBeNull()
        expect(stubData?.isFinal).toBe(false)
        expect(stubData?.sponsor?.icon).toBeTruthy()
        expect(stubData?.sponsor?.name).toBe("Pimlico")
    })
})
