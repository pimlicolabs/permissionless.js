import {
    http,
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
import { createBundlerClient } from "../../clients/createBundlerClient"
import { ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { installModule } from "./installModule"

describe.each(getCoreSmartAccounts())(
    "installmodule $name",
    ({ getErc7579SmartAccountClient, name }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient || name === "Safe")(
            "installModule",
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

                const moduleData = encodePacked(
                    ["address"],
                    [smartClient.account.address]
                )

                const opHash = await installModule(smartClient as any, {
                    account: smartClient.account,
                    type: "execution",
                    address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                    callData: encodePacked(
                        ["address", "bytes"],
                        [
                            zeroAddress,
                            encodeAbiParameters(
                                [{ type: "bytes" }, { type: "bytes" }],
                                [moduleData, "0x"]
                            )
                        ]
                    )
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
            }
        )
    }
)
