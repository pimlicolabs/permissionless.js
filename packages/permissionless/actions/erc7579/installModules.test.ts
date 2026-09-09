import { Account } from "viem"
import { AbiParameters, Address, Secp256k1 } from "viem/utils"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { erc7579Actions } from "../erc7579"
import { installModules } from "./installModules"

describe.each(getCoreSmartAccounts())(
    "installModules $name",
    ({ getErc7579SmartAccountClient, name, isEip7702Compliant }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "installModules",
            async ({ rpc }) => {
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const privateKey = Secp256k1.randomPrivateKey()

                const privateKeyAccount = Account.fromPrivateKey(privateKey)

                const smartClientWithoutExtend =
                    await getErc7579SmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        privateKey,
                        ...rpc
                    })

                const publicClient = getPublicClient(rpc.anvilRpc)

                const smartClient = smartClientWithoutExtend.extend(
                    erc7579Actions()
                )

                const moduleData = AbiParameters.encodePacked(
                    ["address"],
                    [smartClient.account.address]
                )

                const opHash = await installModules(smartClient, {
                    account: smartClient.account,
                    calls: [
                        {
                            to: smartClient.account.address,
                            value: 0n,
                            data: "0x"
                        }
                    ],
                    authorization: isEip7702Compliant
                        ? await privateKeyAccount.signAuthorization?.({
                              address: (smartClient.account as any)
                                  .authorization.address,
                              chainId: smartClient.chain.id,
                              nonce: BigInt(
                                  await publicClient.address.getTransactionCount(
                                      {
                                          address: smartClient.account.address
                                      }
                                  )
                              )
                          })
                        : undefined,
                    modules: [
                        {
                            type: "executor",
                            address:
                                "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                            context: name.startsWith("Kernel 7579")
                                ? AbiParameters.encodePacked(
                                      ["address", "bytes"],
                                      [
                                          Address.zero,
                                          AbiParameters.encode(
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

                expect(opHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

                const userOperationReceipt =
                    await smartClient.userOperation.waitForReceipt({
                        hash: opHash,
                        timeout: 100000
                    })
                expect(userOperationReceipt).not.toBeNull()
                expect(userOperationReceipt?.userOpHash).toBe(opHash)
                expect(
                    userOperationReceipt?.receipt.transactionHash
                ).toBeTruthy()

                const receipt = await smartClient.userOperation.getReceipt({
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
            "installModules post deployment",
            async ({ rpc }) => {
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const privateKey = Secp256k1.randomPrivateKey()

                const privateKeyAccount = Account.fromPrivateKey(privateKey)

                const smartClientWithoutExtend =
                    await getErc7579SmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        privateKey,
                        ...rpc
                    })
                const publicClient = getPublicClient(rpc.anvilRpc)

                const smartClient = smartClientWithoutExtend.extend(
                    erc7579Actions()
                )

                const userOpHash = await smartClient.userOperation.send({
                    authorization: isEip7702Compliant
                        ? await privateKeyAccount.signAuthorization?.({
                              address: (smartClient.account as any)
                                  .authorization.address,
                              chainId: smartClient.chain.id,
                              nonce: BigInt(
                                  await publicClient.address.getTransactionCount(
                                      {
                                          address: smartClient.account.address
                                      }
                                  )
                              )
                          })
                        : undefined,
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

                await smartClient.userOperation.waitForReceipt({
                    hash: userOpHash
                })

                const moduleData = AbiParameters.encodePacked(
                    ["address"],
                    [smartClient.account.address]
                )

                const opHash = await installModules(smartClient, {
                    account: smartClient.account,
                    modules: [
                        {
                            type: "executor",
                            address:
                                "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                            context: name.startsWith("Kernel 7579")
                                ? AbiParameters.encodePacked(
                                      ["address", "bytes"],
                                      [
                                          Address.zero,
                                          AbiParameters.encode(
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

                expect(opHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

                const userOperationReceipt =
                    await smartClient.userOperation.waitForReceipt({
                        hash: opHash,
                        timeout: 100000
                    })
                expect(userOperationReceipt).not.toBeNull()
                expect(userOperationReceipt?.userOpHash).toBe(opHash)
                expect(
                    userOperationReceipt?.receipt.transactionHash
                ).toBeTruthy()

                const receipt = await smartClient.userOperation.getReceipt({
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
