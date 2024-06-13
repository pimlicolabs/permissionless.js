import { type Chain, type Client, type Transport, zeroAddress } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import type { SmartAccount } from "../../accounts"
import type { EntryPoint } from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { sendTransactions } from "./sendTransactions"

describe.each(getCoreSmartAccounts())(
    "sendTransactions $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07
    }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "sendTransactions_v06",
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

                const transactionHash = await sendTransactions(
                    smartClient as Client<
                        Transport,
                        Chain,
                        SmartAccount<EntryPoint>
                    >,
                    {
                        transactions: [
                            {
                                to: zeroAddress,
                                data: "0x",
                                value: 0n
                            },
                            {
                                to: zeroAddress,
                                data: "0x",
                                value: 0n
                            }
                        ]
                    }
                )

                expect(transactionHash).toBeTruthy()

                const publicClient = getPublicClient(anvilRpc)

                const receipt = await publicClient.getTransactionReceipt({
                    hash: transactionHash
                })

                expect(receipt).toBeTruthy()
                expect(receipt.transactionHash).toBe(transactionHash)
                expect(receipt.status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "sendTransactions_v07",
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

                const transactionHash = await sendTransactions(
                    smartClient as Client<
                        Transport,
                        Chain,
                        SmartAccount<EntryPoint>
                    >,
                    {
                        transactions: [
                            {
                                to: zeroAddress,
                                data: "0x",
                                value: 0n
                            },
                            {
                                to: zeroAddress,
                                data: "0x",
                                value: 0n
                            }
                        ]
                    }
                )

                expect(transactionHash).toBeTruthy()

                const publicClient = getPublicClient(anvilRpc)

                const receipt = await publicClient.getTransactionReceipt({
                    hash: transactionHash
                })

                expect(receipt).toBeTruthy()
                expect(receipt.transactionHash).toBe(transactionHash)
                expect(receipt.status).toBe("success")
            }
        )
    }
)
