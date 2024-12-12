import { zeroAddress } from "viem"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { sendTransaction } from "./sendTransaction"

describe.each(getCoreSmartAccounts())(
    "sendTransaction $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07
    }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "sendTransaction_v06",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.6"
                    },
                    ...rpc
                })

                const transactionHash = await sendTransaction(smartClient, {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                })

                expect(transactionHash).toBeTruthy()

                const publicClient = getPublicClient(anvilRpc)

                const receipt = await publicClient.getTransactionReceipt({
                    hash: transactionHash
                })

                expect(receipt).toBeTruthy()
                expect(receipt.transactionHash).toBe(transactionHash)
                expect(receipt.status).toBe("success")

                // -- second transaction after deployment

                const transactionHash2 = await sendTransaction(smartClient, {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                })

                expect(transactionHash2).toBeTruthy()

                const receipt2 = await publicClient.getTransactionReceipt({
                    hash: transactionHash2
                })

                expect(receipt2).toBeTruthy()
                expect(receipt2.transactionHash).toBe(transactionHash2)
                expect(receipt2.status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "sendTransaction_v07",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    privateKey:
                        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // anvil private key
                    ...rpc
                })

                const transactionHash = await sendTransaction(smartClient, {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                })

                expect(transactionHash).toBeTruthy()

                const publicClient = getPublicClient(anvilRpc)

                const receipt = await publicClient.getTransactionReceipt({
                    hash: transactionHash
                })

                expect(receipt).toBeTruthy()
                expect(receipt.transactionHash).toBe(transactionHash)
                expect(receipt.status).toBe("success")

                const transactionHash2 = await sendTransaction(smartClient, {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                })

                // -- second transaction after deployment

                expect(transactionHash2).toBeTruthy()

                const receipt2 = await publicClient.getTransactionReceipt({
                    hash: transactionHash2
                })

                expect(receipt2).toBeTruthy()
                expect(receipt2.transactionHash).toBe(transactionHash2)
                expect(receipt2.status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV06)(
            "sendTransaction_v06 post deployment",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                await (async () => {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.6"
                        },
                        privateKey:
                            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // anvil private key
                        ...rpc
                    })

                    const transactionHash = await sendTransaction(smartClient, {
                        to: zeroAddress,
                        data: "0x",
                        value: 0n
                    })

                    expect(transactionHash).toBeTruthy()

                    const publicClient = getPublicClient(anvilRpc)

                    const receipt = await publicClient.getTransactionReceipt({
                        hash: transactionHash
                    })

                    expect(receipt).toBeTruthy()
                    expect(receipt.transactionHash).toBe(transactionHash)
                    expect(receipt.status).toBe("success")
                })()

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.6"
                    },
                    privateKey:
                        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // anvil private key
                    ...rpc
                })

                const publicClient = getPublicClient(anvilRpc)

                // -- second transaction after deployment
                const transactionHash2 = await sendTransaction(smartClient, {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                })

                expect(transactionHash2).toBeTruthy()

                const receipt2 = await publicClient.getTransactionReceipt({
                    hash: transactionHash2
                })

                expect(receipt2).toBeTruthy()
                expect(receipt2.transactionHash).toBe(transactionHash2)
                expect(receipt2.status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "sendTransaction_v07 post deployment",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                await (async () => {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        ...rpc
                    })

                    const transactionHash = await sendTransaction(smartClient, {
                        to: zeroAddress,
                        data: "0x",
                        value: 0n
                    })

                    expect(transactionHash).toBeTruthy()

                    const publicClient = getPublicClient(anvilRpc)

                    const receipt = await publicClient.getTransactionReceipt({
                        hash: transactionHash
                    })

                    expect(receipt).toBeTruthy()
                    expect(receipt.transactionHash).toBe(transactionHash)
                    expect(receipt.status).toBe("success")
                })()

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    privateKey:
                        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // anvil private key
                    ...rpc
                })

                const publicClient = getPublicClient(anvilRpc)

                const transactionHash2 = await sendTransaction(smartClient, {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                })

                // -- second transaction after deployment

                expect(transactionHash2).toBeTruthy()

                const receipt2 = await publicClient.getTransactionReceipt({
                    hash: transactionHash2
                })

                expect(receipt2).toBeTruthy()
                expect(receipt2.transactionHash).toBe(transactionHash2)
                expect(receipt2.status).toBe("success")
            }
        )
    }
)
