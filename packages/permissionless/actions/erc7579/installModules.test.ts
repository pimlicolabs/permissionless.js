import {
    http,
    type Chain,
    type Transport,
    encodeAbiParameters,
    encodePacked,
    isHash,
    zeroAddress
} from "viem"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient
} from "../../../permissionless-test/src/utils"
import type { SmartAccount } from "../../accounts"
import { createBundlerClient } from "../../clients/createBundlerClient"
import type { SmartAccountClient } from "../../clients/createSmartAccountClient"
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { erc7579Actions } from "../erc7579"
import { installModules } from "./installModules"

describe.each(getCoreSmartAccounts())(
    "installmodules $name",
    ({ getErc7579SmartAccountClient, name }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "installModules",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const privateKey = generatePrivateKey()

                const smartClientWithoutExtend: SmartAccountClient<
                    ENTRYPOINT_ADDRESS_V07_TYPE,
                    Transport,
                    Chain,
                    SmartAccount<ENTRYPOINT_ADDRESS_V07_TYPE>
                > = await getErc7579SmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    privateKey: privateKey,
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V07,
                        paymasterRpc
                    })
                })

                const smartClient = smartClientWithoutExtend.extend(
                    erc7579Actions({
                        entryPoint: ENTRYPOINT_ADDRESS_V07
                    })
                )

                const moduleData = encodePacked(
                    ["address"],
                    [smartClient.account.address]
                )

                const opHash = await installModules(smartClient as any, {
                    account: smartClient.account as any,
                    modules: [
                        {
                            type: "executor",
                            address:
                                "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                            context: name.startsWith("Kernel 7579")
                                ? encodePacked(
                                      ["address", "bytes"],
                                      [
                                          zeroAddress,
                                          encodeAbiParameters(
                                              [
                                                  { type: "bytes" },
                                                  { type: "bytes" }
                                              ],
                                              [moduleData, "0x"]
                                          )
                                      ]
                                  )
                                : moduleData
                        }
                    ]
                })

                const bundlerClientV07 = createBundlerClient({
                    transport: http(altoRpc),
                    entryPoint: ENTRYPOINT_ADDRESS_V07
                })

                expect(isHash(opHash)).toBe(true)

                const userOperationReceipt =
                    await bundlerClientV07.waitForUserOperationReceipt({
                        hash: opHash,
                        timeout: 100000
                    })
                expect(userOperationReceipt).not.toBeNull()
                expect(userOperationReceipt?.userOpHash).toBe(opHash)
                expect(
                    userOperationReceipt?.receipt.transactionHash
                ).toBeTruthy()

                const receipt = await bundlerClientV07.getUserOperationReceipt({
                    hash: opHash
                })

                expect(receipt?.receipt.transactionHash).toBe(
                    userOperationReceipt?.receipt.transactionHash
                )

                const isModuleInstalled = await smartClient.isModuleInstalled({
                    type: "executor",
                    address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                    context: "0x"
                })

                expect(isModuleInstalled).toBe(true)
            }
        )
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "installModule",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const privateKey = generatePrivateKey()

                const smartClientWithoutExtend: SmartAccountClient<
                    ENTRYPOINT_ADDRESS_V07_TYPE,
                    Transport,
                    Chain,
                    SmartAccount<ENTRYPOINT_ADDRESS_V07_TYPE>
                > = await getErc7579SmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    privateKey: privateKey,
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V07,
                        paymasterRpc
                    })
                })

                const smartClient = smartClientWithoutExtend.extend(
                    erc7579Actions({
                        entryPoint: ENTRYPOINT_ADDRESS_V07
                    })
                )

                await smartClient.sendTransactions({
                    transactions: [
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

                const moduleData = encodePacked(
                    ["address"],
                    [smartClient.account.address]
                )

                const opHash = await installModules(smartClient as any, {
                    account: smartClient.account as any,
                    modules: [
                        {
                            type: "executor",
                            address:
                                "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                            context: name.startsWith("Kernel 7579")
                                ? encodePacked(
                                      ["address", "bytes"],
                                      [
                                          zeroAddress,
                                          encodeAbiParameters(
                                              [
                                                  { type: "bytes" },
                                                  { type: "bytes" }
                                              ],
                                              [moduleData, "0x"]
                                          )
                                      ]
                                  )
                                : moduleData
                        }
                    ]
                })

                const bundlerClientV07 = createBundlerClient({
                    transport: http(altoRpc),
                    entryPoint: ENTRYPOINT_ADDRESS_V07
                })

                expect(isHash(opHash)).toBe(true)

                const userOperationReceipt =
                    await bundlerClientV07.waitForUserOperationReceipt({
                        hash: opHash,
                        timeout: 100000
                    })
                expect(userOperationReceipt).not.toBeNull()
                expect(userOperationReceipt?.userOpHash).toBe(opHash)
                expect(
                    userOperationReceipt?.receipt.transactionHash
                ).toBeTruthy()

                const receipt = await bundlerClientV07.getUserOperationReceipt({
                    hash: opHash
                })

                expect(receipt?.receipt.transactionHash).toBe(
                    userOperationReceipt?.receipt.transactionHash
                )

                const isModuleInstalled = await smartClient.isModuleInstalled({
                    type: "executor",
                    address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                    context: "0x"
                })

                expect(isModuleInstalled).toBe(true)
            }
        )
    }
)
