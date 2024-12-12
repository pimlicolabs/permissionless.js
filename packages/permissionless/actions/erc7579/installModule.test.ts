import { encodeAbiParameters, encodePacked, isHash, zeroAddress } from "viem"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getCoreSmartAccounts } from "../../../permissionless-test/src/utils"
import { erc7579Actions } from "../erc7579"
import { installModule } from "./installModule"

describe.each(getCoreSmartAccounts())(
    "installModule $name",
    ({ getErc7579SmartAccountClient, name }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "installModule",
            async ({ rpc }) => {
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const smartClientWithoutExtend =
                    await getErc7579SmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        ...rpc
                    })

                const smartClient = smartClientWithoutExtend.extend(
                    erc7579Actions()
                )

                const moduleData = encodePacked(
                    ["address"],
                    [smartClient.account.address]
                )

                const opHash = await installModule(smartClient, {
                    account: smartClient.account,
                    type: "executor",
                    address: "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                    initData: name.startsWith("Kernel 7579")
                        ? encodePacked(
                              ["address", "bytes"],
                              [
                                  zeroAddress,
                                  encodeAbiParameters(
                                      [{ type: "bytes" }, { type: "bytes" }],
                                      [moduleData, "0x"]
                                  )
                              ]
                          )
                        : moduleData
                })

                expect(isHash(opHash)).toBe(true)

                const userOperationReceipt =
                    await smartClient.waitForUserOperationReceipt({
                        hash: opHash,
                        timeout: 100000
                    })

                expect(userOperationReceipt).not.toBeNull()
                expect(userOperationReceipt?.userOpHash).toBe(opHash)
                expect(
                    userOperationReceipt?.receipt.transactionHash
                ).toBeTruthy()

                const receipt = await smartClient.getUserOperationReceipt({
                    hash: opHash
                })

                expect(receipt?.receipt.transactionHash).toBe(
                    userOperationReceipt?.receipt.transactionHash
                )

                const isModuleInstalled = await smartClient.isModuleInstalled({
                    type: "executor",
                    address: "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                    context: "0x"
                })

                expect(isModuleInstalled).toBe(true)
            }
        )
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "installModule",
            async ({ rpc }) => {
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const smartClientWithoutExtend =
                    await getErc7579SmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        ...rpc
                    })

                const smartClient = smartClientWithoutExtend.extend(
                    erc7579Actions()
                )

                const userOpHash = await smartClient.sendUserOperation({
                    calls: [
                        {
                            to: smartClient.account.address,
                            value: 0n,
                            data: "0x"
                        },
                        {
                            to: smartClient.account.address,
                            value: 0n,
                            data: "0x"
                        }
                    ]
                })

                await smartClient.waitForUserOperationReceipt({
                    hash: userOpHash
                })

                const moduleData = encodePacked(
                    ["address"],
                    [smartClient.account.address]
                )

                const opHash = await installModule(smartClient, {
                    account: smartClient.account,
                    type: "executor",
                    address: "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                    context: name.startsWith("Kernel 7579")
                        ? encodePacked(
                              ["address", "bytes"],
                              [
                                  zeroAddress,
                                  encodeAbiParameters(
                                      [{ type: "bytes" }, { type: "bytes" }],
                                      [moduleData, "0x"]
                                  )
                              ]
                          )
                        : moduleData
                })

                expect(isHash(opHash)).toBe(true)

                const userOperationReceipt =
                    await smartClient.waitForUserOperationReceipt({
                        hash: opHash,
                        timeout: 100000
                    })
                expect(userOperationReceipt).not.toBeNull()
                expect(userOperationReceipt?.userOpHash).toBe(opHash)
                expect(
                    userOperationReceipt?.receipt.transactionHash
                ).toBeTruthy()

                const receipt = await smartClient.getUserOperationReceipt({
                    hash: opHash
                })

                expect(receipt?.receipt.transactionHash).toBe(
                    userOperationReceipt?.receipt.transactionHash
                )

                const isModuleInstalled = await smartClient.isModuleInstalled({
                    type: "executor",
                    address: "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                    context: "0x"
                })

                expect(isModuleInstalled).toBe(true)
            }
        )
    }
)
