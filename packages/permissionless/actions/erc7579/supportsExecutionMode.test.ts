import { zeroAddress } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient
} from "../../../permissionless-test/src/utils"
import { ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { supportsExecutionMode } from "./supportsExecutionMode"

describe.each(getCoreSmartAccounts())(
    "supportsExecutionMode $name",
    ({ getErc7579SmartAccountClient }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "supportsExecutionMode",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const smartClient = await getErc7579SmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V07,
                        paymasterRpc
                    })
                })

                const supportsExecutionModeBatchCallBeforeDeploy =
                    await supportsExecutionMode(smartClient as any, {
                        account: smartClient.account as any,
                        type: "batchcall",
                        revertOnError: false,
                        selector: "0x0",
                        context: "0x"
                    })

                expect(supportsExecutionModeBatchCallBeforeDeploy).toBe(true)

                // deploy account
                await smartClient.sendTransaction({
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                })

                const supportsExecutionModeBatchCallBeforeDeployPostDeploy =
                    await supportsExecutionMode(smartClient as any, {
                        account: smartClient.account as any,
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
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const smartClient = await getErc7579SmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V07,
                        paymasterRpc
                    })
                })

                const supportsExecutionModeBatchCallBeforeDeploy =
                    await supportsExecutionMode(smartClient as any, {
                        account: smartClient.account as any,
                        type: "delegatecall"
                    })

                expect(supportsExecutionModeBatchCallBeforeDeploy).toBe(true)

                // deploy account
                await smartClient.sendTransaction({
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                })

                const supportsExecutionModeBatchCallBeforeDeployPostDeploy =
                    await supportsExecutionMode(smartClient as any, {
                        account: smartClient.account as any,
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
