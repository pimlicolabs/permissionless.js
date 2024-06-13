import { type Chain, type Client, type Transport, zeroAddress } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getCoreSmartAccounts,
    getPimlicoPaymasterClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import type { SmartAccount } from "../../accounts"
import type { EntryPoint } from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { sendUserOperation } from "./sendUserOperation"

describe.each(getCoreSmartAccounts())(
    "sendUserOperation $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07
    }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "sendUserOperation_v06",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V06,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V06,
                        paymasterRpc
                    })
                })

                const userOperationHash = await sendUserOperation(
                    smartClient as Client<
                        Transport,
                        Chain,
                        SmartAccount<EntryPoint>
                    >,
                    {
                        userOperation: {
                            callData: await smartClient.account.encodeCallData({
                                to: zeroAddress,
                                data: "0x",
                                value: 0n
                            })
                        }
                    }
                )

                expect(userOperationHash).toBeTruthy()

                const bundlerClient = getBundlerClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V06,
                    altoRpc
                })

                const receipt = await bundlerClient.waitForUserOperationReceipt(
                    {
                        hash: userOperationHash
                    }
                )

                expect(receipt).toBeTruthy()
                expect(receipt.userOpHash).toBe(userOperationHash)
                expect(receipt.entryPoint.toLowerCase()).toBe(
                    ENTRYPOINT_ADDRESS_V06.toLowerCase()
                )
                expect(receipt.receipt.status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "sendUserOperation_v07",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V07,
                        paymasterRpc
                    })
                })

                const userOperationHash = await sendUserOperation(
                    smartClient as Client<
                        Transport,
                        Chain,
                        SmartAccount<EntryPoint>
                    >,
                    {
                        userOperation: {
                            callData: await smartClient.account.encodeCallData({
                                to: zeroAddress,
                                data: "0x",
                                value: 0n
                            })
                        }
                    }
                )

                expect(userOperationHash).toBeTruthy()

                const bundlerClient = getBundlerClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    altoRpc
                })

                const receipt = await bundlerClient.waitForUserOperationReceipt(
                    {
                        hash: userOperationHash
                    }
                )

                expect(receipt).toBeTruthy()
                expect(receipt.userOpHash).toBe(userOperationHash)
                expect(receipt.entryPoint.toLowerCase()).toBe(
                    ENTRYPOINT_ADDRESS_V07.toLowerCase()
                )
                expect(receipt.receipt.status).toBe("success")
            }
        )
    }
)
