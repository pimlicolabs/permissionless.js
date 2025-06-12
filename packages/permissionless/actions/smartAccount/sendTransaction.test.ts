import { zeroAddress } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { sendTransaction } from "./sendTransaction"

const privateKey =
    "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"

describe.each(getCoreSmartAccounts())(
    "sendTransaction $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07,
        supportsEntryPointV08,
        isEip7702Compliant
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

                const privateKeyAccount = privateKeyToAccount(privateKey)

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    privateKey, // anvil private key
                    ...rpc
                })

                const publicClient = getPublicClient(anvilRpc)

                const transactionHash = await sendTransaction(smartClient, {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n,
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

                expect(transactionHash).toBeTruthy()

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

        testWithRpc.skipIf(!supportsEntryPointV08)(
            "sendTransaction_v08",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = privateKeyToAccount(privateKey)

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.8"
                    },
                    privateKey, // anvil private key
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

                const transactionHash = await sendTransaction(smartClient, {
                    to: zeroAddress,
                    data: "0x",
                    value: 0n,
                    authorization
                })

                expect(transactionHash).toBeTruthy()

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
                        privateKey, // anvil private key
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
                    privateKey, // anvil private key
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
                    const privateKeyAccount = privateKeyToAccount(privateKey)

                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        privateKey, // anvil private key
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

                    const transactionHash = await sendTransaction(smartClient, {
                        to: zeroAddress,
                        data: "0x",
                        value: 0n,
                        authorization
                    })

                    expect(transactionHash).toBeTruthy()

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
                    privateKey, // anvil private key
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

        testWithRpc.skipIf(!supportsEntryPointV08)(
            "sendTransaction_v08 post deployment",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = privateKeyToAccount(privateKey)

                await (async () => {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.8"
                        },
                        privateKey, // anvil private key
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

                    const transactionHash = await sendTransaction(smartClient, {
                        to: zeroAddress,
                        data: "0x",
                        value: 0n,
                        authorization
                    })

                    expect(transactionHash).toBeTruthy()

                    const receipt = await publicClient.getTransactionReceipt({
                        hash: transactionHash
                    })

                    expect(receipt).toBeTruthy()
                    expect(receipt.transactionHash).toBe(transactionHash)
                    expect(receipt.status).toBe("success")
                })()

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.8"
                    },
                    privateKey, // anvil private key
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
