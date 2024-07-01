import {
    http,
    type Chain,
    type Transport,
    encodeAbiParameters,
    encodePacked,
    zeroAddress
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { describe, expect } from "vitest"
import { erc7579Actions } from "."
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
import { isModuleInstalled } from "./isModuleInstalled"

describe.each(getCoreSmartAccounts())(
    "isModuleInstalled $name",
    ({ getErc7579SmartAccountClient, name }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "isModuleInstalled",
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

                const opHash = await smartClient.installModule({
                    account: smartClient.account as any,
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

                const bundlerClientV07 = createBundlerClient({
                    transport: http(altoRpc),
                    entryPoint: ENTRYPOINT_ADDRESS_V07
                })

                const receipt =
                    await bundlerClientV07.waitForUserOperationReceipt({
                        hash: opHash,
                        timeout: 100000
                    })

                const isModuleInstalledResult = await isModuleInstalled(
                    smartClient as any,
                    {
                        account: smartClient.account as any,
                        type: "executor",
                        address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                        context: "0x"
                    }
                )

                expect(isModuleInstalledResult).toBe(true)

                const nextTransaction = await smartClient.sendTransaction({
                    to: zeroAddress,
                    value: 0n
                })

                expect(nextTransaction).toBeTruthy()
            }
        )
    }
)
