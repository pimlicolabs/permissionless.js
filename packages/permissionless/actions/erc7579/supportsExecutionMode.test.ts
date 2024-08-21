import { zeroAddress } from "viem"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getCoreSmartAccounts } from "../../../permissionless-test/src/utils"
import { supportsExecutionMode } from "./supportsExecutionMode"

describe.each(getCoreSmartAccounts())(
    "supportsExecutionMode $name",
    ({ getErc7579SmartAccountClient }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "supportsExecutionMode",
            async ({ rpc }) => {
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const smartClient = await getErc7579SmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                const supportsExecutionModeBatchCallBeforeDeploy =
                    await supportsExecutionMode(smartClient, {
                        account: smartClient.account,
                        type: "batchcall",
                        revertOnError: false,
                        selector: "0x0",
                        context: "0x"
                    })

                expect(supportsExecutionModeBatchCallBeforeDeploy).toBe(true)

                // deploy account
                const userOpHash = await smartClient.sendUserOperation({
                    calls: [{ to: zeroAddress, value: 0n, data: "0x" }]
                })

                await smartClient.waitForUserOperationReceipt({
                    hash: userOpHash
                })

                const supportsExecutionModeBatchCallBeforeDeployPostDeploy =
                    await supportsExecutionMode(smartClient, {
                        account: smartClient.account,
                        type: "batchcall",
                        revertOnError: false,
                        selector: "0x0",
                        context: "0x"
                    })

                expect(
                    supportsExecutionModeBatchCallBeforeDeployPostDeploy
                ).toBe(true)

                expect(supportsExecutionModeBatchCallBeforeDeploy).toBe(
                    supportsExecutionModeBatchCallBeforeDeployPostDeploy
                )
            }
        )
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "supportsExecutionMode",
            async ({ rpc }) => {
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const smartClient = await getErc7579SmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                const supportsExecutionModeBatchCallBeforeDeploy =
                    await supportsExecutionMode(smartClient, {
                        account: smartClient.account,
                        type: "delegatecall"
                    })

                expect(supportsExecutionModeBatchCallBeforeDeploy).toBe(true)

                // deploy account
                const userOpHash = await smartClient.sendUserOperation({
                    calls: [{ to: zeroAddress, value: 0n, data: "0x" }]
                })

                await smartClient.waitForUserOperationReceipt({
                    hash: userOpHash
                })

                const supportsExecutionModeBatchCallBeforeDeployPostDeploy =
                    await supportsExecutionMode(smartClient, {
                        account: smartClient.account,
                        type: "batchcall",
                        revertOnError: false,
                        selector: "0x0",
                        context: "0x"
                    })

                expect(
                    supportsExecutionModeBatchCallBeforeDeployPostDeploy
                ).toBe(true)

                expect(supportsExecutionModeBatchCallBeforeDeploy).toBe(
                    supportsExecutionModeBatchCallBeforeDeployPostDeploy
                )
            }
        )
    }
)
