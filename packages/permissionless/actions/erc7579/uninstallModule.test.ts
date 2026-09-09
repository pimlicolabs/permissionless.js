import { Account } from "viem"
import { AbiParameters, Address, Secp256k1 } from "viem/utils"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { erc7579Actions } from "../erc7579"
import { uninstallModule } from "./uninstallModule"

describe.each(getCoreSmartAccounts())(
    "uninstallModule $name",
    ({ getErc7579SmartAccountClient, name, isEip7702Compliant }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "uninstallModule",
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

                const opHash = await smartClient.installModule({
                    type: "executor",
                    address: "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                    context: name.startsWith("Kernel 7579")
                        ? AbiParameters.encodePacked(
                              ["address", "bytes"],
                              [
                                  Address.zero,
                                  AbiParameters.encode(
                                      [{ type: "bytes" }, { type: "bytes" }],
                                      [moduleData, "0x"]
                                  )
                              ]
                          )
                        : moduleData,
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
                        : undefined
                })

                await smartClient.userOperation.waitForReceipt({
                    hash: opHash,
                    timeout: 100000
                })

                const uninstallModuleUserOpHash = await uninstallModule(
                    smartClient,
                    {
                        account: smartClient.account,
                        type: "executor",
                        address: "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                        context: name.startsWith("Kernel 7579")
                            ? "0x"
                            : AbiParameters.encode(
                                  [
                                      { name: "prev", type: "address" },
                                      {
                                          name: "moduleInitData",
                                          type: "bytes"
                                      }
                                  ],
                                  [
                                      "0x0000000000000000000000000000000000000001",
                                      "0x"
                                  ]
                              )
                    }
                )

                expect(uninstallModuleUserOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

                const userOperationReceiptUninstallModule =
                    await smartClient.userOperation.waitForReceipt({
                        hash: uninstallModuleUserOpHash,
                        timeout: 100000
                    })
                expect(userOperationReceiptUninstallModule).not.toBeNull()
                expect(userOperationReceiptUninstallModule?.userOpHash).toBe(
                    uninstallModuleUserOpHash
                )
                expect(
                    userOperationReceiptUninstallModule?.receipt.transactionHash
                ).toBeTruthy()

                const receiptUninstallModule =
                    await smartClient.userOperation.getReceipt({
                        hash: uninstallModuleUserOpHash
                    })

                expect(receiptUninstallModule?.receipt.transactionHash).toBe(
                    userOperationReceiptUninstallModule?.receipt.transactionHash
                )
            }
        )
    }
)
