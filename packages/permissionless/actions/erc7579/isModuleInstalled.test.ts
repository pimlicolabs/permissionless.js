import { encodeAbiParameters, encodePacked, zeroAddress } from "viem"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getCoreSmartAccounts } from "../../../permissionless-test/src/utils"
import { erc7579Actions } from "../erc7579"
import { isModuleInstalled } from "./isModuleInstalled"

describe.each(getCoreSmartAccounts())(
    "isModuleInstalled $name",
    ({ getErc7579SmartAccountClient, name }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "isModuleInstalled",
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

                const opHash = await smartClient.installModule({
                    account: smartClient.account as any,
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

                await smartClient.waitForUserOperationReceipt({
                    hash: opHash,
                    timeout: 100000
                })

                const isModuleInstalledResult = await isModuleInstalled(
                    smartClient,
                    {
                        account: smartClient.account,
                        type: "executor",
                        address: "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                        context: "0x"
                    }
                )

                expect(isModuleInstalledResult).toBe(true)
            }
        )
    }
)
