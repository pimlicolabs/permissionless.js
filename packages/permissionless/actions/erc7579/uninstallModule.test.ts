import {
    http,
    type Chain,
    type Transport,
    encodeAbiParameters,
    encodePacked,
    isHash,
    zeroAddress
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import type { SmartAccount } from "../../accounts"
import { createBundlerClient } from "../../clients/createBundlerClient"
import type { SmartAccountClient } from "../../clients/createSmartAccountClient"
import { erc7579Actions } from "../../clients/decorators/erc7579"
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from "../../types"
import { ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { uninstallModule } from "./uninstallModule"

describe.each(getCoreSmartAccounts())(
    "uninstallModule $name",
    ({ getErc7579SmartAccountClient, name }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "uninstallModule",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const privateKey = generatePrivateKey()

                const eoaAccount = privateKeyToAccount(privateKey)

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

                const bundlerClientV07 = createBundlerClient({
                    transport: http(altoRpc),
                    entryPoint: ENTRYPOINT_ADDRESS_V07
                })

                const publicClient = getPublicClient(anvilRpc)

                const opHash = await smartClient.installModule({
                    type: "executor",
                    address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                    context:
                        name === "Kernel"
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
                })

                const userOperationReceipt =
                    await bundlerClientV07.waitForUserOperationReceipt({
                        hash: opHash,
                        timeout: 100000
                    })

                await publicClient.waitForTransactionReceipt({
                    hash: userOperationReceipt.receipt.transactionHash
                })

                const uninstallModuleUserOpHash = await uninstallModule(
                    smartClient as any,
                    {
                        account: smartClient.account as any,
                        type: "executor",
                        address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                        context:
                            name === "Kernel"
                                ? "0x"
                                : encodeAbiParameters(
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

                expect(isHash(uninstallModuleUserOpHash)).toBe(true)

                const userOperationReceiptUninstallModule =
                    await bundlerClientV07.waitForUserOperationReceipt({
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
                    await bundlerClientV07.getUserOperationReceipt({
                        hash: uninstallModuleUserOpHash
                    })

                expect(receiptUninstallModule?.receipt.transactionHash).toBe(
                    userOperationReceiptUninstallModule?.receipt.transactionHash
                )
            }
        )
    }
)
