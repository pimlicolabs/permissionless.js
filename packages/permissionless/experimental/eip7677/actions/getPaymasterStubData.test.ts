import { zeroAddress } from "viem"
import {
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPimlicoClient,
    getSimpleAccountClient
} from "../../../../permissionless-test/src/utils"
import { paymasterActionsEip7677 } from "../clients/decorators/paymasterActionsEip7677"

describe("EIP-7677 getPaymasterStubData", () => {
    testWithRpc("getPaymasterStubData_V06", async ({ rpc }) => {
        const { paymasterRpc } = rpc

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleAccountClient({
                ...rpc,
                entryPoint: {
                    version: "0.6"
                }
            }),
            entryPoint: {
                version: "0.6"
            },
            ...rpc
        })

        const pimlicoPaymasterClient = getPimlicoClient({
            entryPointVersion: "0.6",
            altoRpc: paymasterRpc
        }).extend(
            paymasterActionsEip7677({
                address: entryPoint06Address,
                version: "0.6"
            })
        )

        const userOperation = await simpleAccountClient.prepareUserOperation({
            calls: [
                {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                }
            ]
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
        const { paymasterRpc } = rpc

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleAccountClient({
                ...rpc,
                entryPoint: {
                    version: "0.7"
                }
            }),
            entryPoint: {
                version: "0.7"
            },
            ...rpc
        })

        const pimlicoPaymasterClient = getPimlicoClient({
            entryPointVersion: "0.7",
            altoRpc: paymasterRpc
        }).extend(
            paymasterActionsEip7677({
                address: entryPoint07Address,
                version: "0.7"
            })
        )

        const userOperation = await simpleAccountClient.prepareUserOperation({
            calls: [
                {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                }
            ]
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
