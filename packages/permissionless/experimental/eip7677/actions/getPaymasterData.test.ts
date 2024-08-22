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

describe("EIP-7677 getPaymasterData", () => {
    testWithRpc("getPaymasterData_V06", async ({ rpc }) => {
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

        let userOperation = await simpleAccountClient.prepareUserOperation({
            calls: [
                {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                }
            ]
        })

        const paymasterData = await pimlicoPaymasterClient.getPaymasterData({
            userOperation,
            chain: foundry
        })
        expect(paymasterData).not.toBeNull()
        expect(paymasterData?.paymasterAndData).not.toBeNull()

        // test that smart account can send op with the returned values
        const bundlerClient = getBundlerClient({
            entryPoint: {
                version: "0.6"
            },
            ...rpc
        })

        userOperation = {
            ...userOperation,
            ...paymasterData
        }
        userOperation.signature =
            await simpleAccountClient.account.signUserOperation(userOperation)

        const hash = await bundlerClient.sendUserOperation({
            account: simpleAccountClient.account,
            ...userOperation
        })

        const receipt = await bundlerClient.waitForUserOperationReceipt({
            hash
        })
        expect(receipt.success).toBeTruthy()
    })

    testWithRpc("getPaymasterData_V07", async ({ rpc }) => {
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

        let userOperation = await simpleAccountClient.prepareUserOperation({
            calls: [
                {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                }
            ]
        })

        const paymasterGasValues = {
            paymasterPostOpGasLimit: 150_000n,
            paymasterVerificationGasLimit: 650_000n
        }

        const paymasterData = await pimlicoPaymasterClient.getPaymasterData({
            userOperation: {
                ...userOperation,
                ...paymasterGasValues
            },
            chain: foundry
        })
        expect(paymasterData).not.toBeNull()
        expect(paymasterData?.paymaster).not.toBeNull()
        expect(paymasterData?.paymasterData).not.toBeNull()

        // test that smart account can send op with the returned values
        const bundlerClient = getBundlerClient({
            entryPoint: {
                version: "0.7"
            },
            ...rpc
        })

        userOperation = {
            ...userOperation,
            ...paymasterGasValues,
            ...paymasterData
        }

        userOperation.signature =
            await simpleAccountClient.account.signUserOperation(userOperation)

        const hash = await bundlerClient.sendUserOperation({
            account: simpleAccountClient.account,
            ...userOperation
        })

        const receipt = await bundlerClient.waitForUserOperationReceipt({
            hash
        })
        expect(receipt.success).toBeTruthy()
    })
})
