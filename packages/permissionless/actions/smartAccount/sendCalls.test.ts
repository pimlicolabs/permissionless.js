import { type Hex, zeroAddress } from "viem"
import { waitForUserOperationReceipt } from "viem/account-abstraction"
import { privateKeyToAccount } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { sendCalls } from "./sendCalls"

const privateKey =
    "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"

describe.each(getCoreSmartAccounts())(
    "sendCalls $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07,
        supportsEntryPointV08,
        isEip7702Compliant
    }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "sendCalls_v06",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.6"
                    },
                    ...rpc
                })

                const { id: userOpHash } = await sendCalls(smartClient, {
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ]
                })

                expect(userOpHash).toBeTruthy()
                expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

                const receipt = await waitForUserOperationReceipt(smartClient, {
                    hash: userOpHash as Hex
                })

                expect(receipt).toBeTruthy()
                expect(receipt.success).toBe(true)

                const publicClient = getPublicClient(anvilRpc)

                const txReceipt = await publicClient.getTransactionReceipt({
                    hash: receipt.receipt.transactionHash
                })

                expect(txReceipt).toBeTruthy()
                expect(txReceipt.status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV06)(
            "sendCalls_v06 with multiple calls",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.6"
                    },
                    ...rpc
                })

                const { id: userOpHash } = await sendCalls(smartClient, {
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        },
                        {
                            to: zeroAddress,
                            data: "0x1234",
                            value: 0n
                        },
                        {
                            to: zeroAddress,
                            data: "0x5678",
                            value: 0n
                        }
                    ]
                })

                expect(userOpHash).toBeTruthy()
                expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

                const receipt = await waitForUserOperationReceipt(smartClient, {
                    hash: userOpHash as Hex
                })

                expect(receipt).toBeTruthy()
                expect(receipt.success).toBe(true)

                const publicClient = getPublicClient(anvilRpc)

                const txReceipt = await publicClient.getTransactionReceipt({
                    hash: receipt.receipt.transactionHash
                })

                expect(txReceipt).toBeTruthy()
                expect(txReceipt.status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "sendCalls_v07",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = privateKeyToAccount(privateKey)

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    privateKey,
                    ...rpc
                })

                const publicClient = getPublicClient(anvilRpc)

                const { id: userOpHash } = await sendCalls(smartClient, {
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ],
                    authorization: isEip7702Compliant
                        ? await privateKeyAccount.signAuthorization({
                              address: (smartClient.account as any)
                                  .implementation,
                              chainId: smartClient.chain.id,
                              nonce: await publicClient.getTransactionCount({
                                  address: smartClient.account.address
                              })
                          })
                        : undefined
                })

                expect(userOpHash).toBeTruthy()
                expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

                const receipt = await waitForUserOperationReceipt(smartClient, {
                    hash: userOpHash as Hex
                })

                expect(receipt).toBeTruthy()
                expect(receipt.success).toBe(true)

                const txReceipt = await publicClient.getTransactionReceipt({
                    hash: receipt.receipt.transactionHash
                })

                expect(txReceipt).toBeTruthy()
                expect(txReceipt.status).toBe("success")

                // Second transaction after deployment
                const { id: userOpHash2 } = await sendCalls(smartClient, {
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ]
                })

                expect(userOpHash2).toBeTruthy()
                expect(userOpHash2).toMatch(/^0x[a-fA-F0-9]{64}$/)

                const receipt2 = await waitForUserOperationReceipt(
                    smartClient,
                    {
                        hash: userOpHash2 as Hex
                    }
                )

                expect(receipt2).toBeTruthy()
                expect(receipt2.success).toBe(true)
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV08)(
            "sendCalls_v08",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = privateKeyToAccount(privateKey)

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.8"
                    },
                    privateKey,
                    ...rpc
                })

                const publicClient = getPublicClient(anvilRpc)

                const authorization = isEip7702Compliant
                    ? await privateKeyAccount.signAuthorization({
                          address: (smartClient.account as any).implementation,
                          chainId: smartClient.chain.id,
                          nonce: await publicClient.getTransactionCount({
                              address: smartClient.account.address
                          })
                      })
                    : undefined

                const { id: userOpHash } = await sendCalls(smartClient, {
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ],
                    authorization
                })

                expect(userOpHash).toBeTruthy()
                expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

                const receipt = await waitForUserOperationReceipt(smartClient, {
                    hash: userOpHash as Hex
                })

                expect(receipt).toBeTruthy()
                expect(receipt.success).toBe(true)

                const txReceipt = await publicClient.getTransactionReceipt({
                    hash: receipt.receipt.transactionHash
                })

                expect(txReceipt).toBeTruthy()
                expect(txReceipt.status).toBe("success")

                // Second transaction after deployment
                const { id: userOpHash2 } = await sendCalls(smartClient, {
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ]
                })

                expect(userOpHash2).toBeTruthy()
                expect(userOpHash2).toMatch(/^0x[a-fA-F0-9]{64}$/)

                const receipt2 = await waitForUserOperationReceipt(
                    smartClient,
                    {
                        hash: userOpHash2 as Hex
                    }
                )

                expect(receipt2).toBeTruthy()
                expect(receipt2.success).toBe(true)
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV06)(
            "sendCalls_v06 post deployment",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                await (async () => {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.6"
                        },
                        privateKey,
                        ...rpc
                    })

                    const { id: userOpHash } = await sendCalls(smartClient, {
                        calls: [
                            {
                                to: zeroAddress,
                                data: "0x",
                                value: 0n
                            }
                        ]
                    })

                    expect(userOpHash).toBeTruthy()

                    const receipt = await waitForUserOperationReceipt(
                        smartClient,
                        {
                            hash: userOpHash as Hex
                        }
                    )

                    expect(receipt).toBeTruthy()
                    expect(receipt.success).toBe(true)

                    const publicClient = getPublicClient(anvilRpc)

                    const txReceipt = await publicClient.getTransactionReceipt({
                        hash: receipt.receipt.transactionHash
                    })

                    expect(txReceipt).toBeTruthy()
                    expect(txReceipt.status).toBe("success")
                })()

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.6"
                    },
                    privateKey,
                    ...rpc
                })

                // Second transaction after deployment
                const { id: userOpHash2 } = await sendCalls(smartClient, {
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ]
                })

                expect(userOpHash2).toBeTruthy()

                const receipt2 = await waitForUserOperationReceipt(
                    smartClient,
                    {
                        hash: userOpHash2 as Hex
                    }
                )

                expect(receipt2).toBeTruthy()
                expect(receipt2.success).toBe(true)

                const publicClient = getPublicClient(anvilRpc)

                const txReceipt2 = await publicClient.getTransactionReceipt({
                    hash: receipt2.receipt.transactionHash
                })

                expect(txReceipt2).toBeTruthy()
                expect(txReceipt2.status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "sendCalls_v07 post deployment",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                await (async () => {
                    const privateKeyAccount = privateKeyToAccount(privateKey)

                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        privateKey,
                        ...rpc
                    })

                    const publicClient = getPublicClient(anvilRpc)

                    const authorization = isEip7702Compliant
                        ? await privateKeyAccount.signAuthorization({
                              address: (smartClient.account as any)
                                  .implementation,
                              chainId: smartClient.chain.id,
                              nonce: await publicClient.getTransactionCount({
                                  address: smartClient.account.address
                              })
                          })
                        : undefined

                    const { id: userOpHash } = await sendCalls(smartClient, {
                        calls: [
                            {
                                to: zeroAddress,
                                data: "0x",
                                value: 0n
                            }
                        ],
                        authorization
                    })

                    expect(userOpHash).toBeTruthy()

                    const receipt = await waitForUserOperationReceipt(
                        smartClient,
                        {
                            hash: userOpHash as Hex
                        }
                    )

                    expect(receipt).toBeTruthy()
                    expect(receipt.success).toBe(true)

                    const txReceipt = await publicClient.getTransactionReceipt({
                        hash: receipt.receipt.transactionHash
                    })

                    expect(txReceipt).toBeTruthy()
                    expect(txReceipt.status).toBe("success")
                })()

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    privateKey,
                    ...rpc
                })

                const { id: userOpHash2 } = await sendCalls(smartClient, {
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ]
                })

                expect(userOpHash2).toBeTruthy()

                const receipt2 = await waitForUserOperationReceipt(
                    smartClient,
                    {
                        hash: userOpHash2 as Hex
                    }
                )

                expect(receipt2).toBeTruthy()
                expect(receipt2.success).toBe(true)

                const publicClient = getPublicClient(anvilRpc)

                const txReceipt2 = await publicClient.getTransactionReceipt({
                    hash: receipt2.receipt.transactionHash
                })

                expect(txReceipt2).toBeTruthy()
                expect(txReceipt2.status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV08)(
            "sendCalls_v08 post deployment",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = privateKeyToAccount(privateKey)

                await (async () => {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.8"
                        },
                        privateKey,
                        ...rpc
                    })

                    const publicClient = getPublicClient(anvilRpc)

                    const authorization = isEip7702Compliant
                        ? await privateKeyAccount.signAuthorization({
                              address: (smartClient.account as any)
                                  .implementation,
                              chainId: smartClient.chain.id,
                              nonce: await publicClient.getTransactionCount({
                                  address: smartClient.account.address
                              })
                          })
                        : undefined

                    const { id: userOpHash } = await sendCalls(smartClient, {
                        calls: [
                            {
                                to: zeroAddress,
                                data: "0x",
                                value: 0n
                            }
                        ],
                        authorization
                    })

                    expect(userOpHash).toBeTruthy()

                    const receipt = await waitForUserOperationReceipt(
                        smartClient,
                        {
                            hash: userOpHash as Hex
                        }
                    )

                    expect(receipt).toBeTruthy()
                    expect(receipt.success).toBe(true)

                    const txReceipt = await publicClient.getTransactionReceipt({
                        hash: receipt.receipt.transactionHash
                    })

                    expect(txReceipt).toBeTruthy()
                    expect(txReceipt.status).toBe("success")
                })()

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.8"
                    },
                    privateKey,
                    ...rpc
                })

                const { id: userOpHash2 } = await sendCalls(smartClient, {
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ]
                })

                expect(userOpHash2).toBeTruthy()

                const receipt2 = await waitForUserOperationReceipt(
                    smartClient,
                    {
                        hash: userOpHash2 as Hex
                    }
                )

                expect(receipt2).toBeTruthy()
                expect(receipt2.success).toBe(true)

                const publicClient = getPublicClient(anvilRpc)

                const txReceipt2 = await publicClient.getTransactionReceipt({
                    hash: receipt2.receipt.transactionHash
                })

                expect(txReceipt2).toBeTruthy()
                expect(txReceipt2.status).toBe("success")
            }
        )
    }
)
