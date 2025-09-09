import { type Hex, zeroAddress } from "viem"
import { waitForUserOperationReceipt } from "viem/account-abstraction"
import { privateKeyToAccount } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { getCallsStatus } from "./getCallsStatus"
import { sendCalls } from "./sendCalls"

const privateKey =
    "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"

describe.each(getCoreSmartAccounts())(
    "getCallsStatus $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07,
        supportsEntryPointV08,
        isEip7702Compliant
    }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "getCallsStatus_v06",
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

                const publicClient = getPublicClient(anvilRpc)

                await smartClient.waitForUserOperationReceipt({
                    hash: userOpHash as Hex
                })

                const status = await getCallsStatus(smartClient, {
                    id: userOpHash
                })

                expect(status).toBeTruthy()
                expect(status.id).toBe(userOpHash)
                expect(status.version).toBe("1.0")
                expect(status.chainId).toBe(smartClient.chain.id)
                expect(status.atomic).toBe(true)
                expect(status.status).toBe("success")
                expect(status.statusCode).toBe(200)
                expect(status.receipts).toBeDefined()
                expect(status.receipts?.length).toBeGreaterThan(0)
                expect(status.receipts?.[0].status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV06)(
            "getCallsStatus_v06 pending status",
            async ({ rpc }) => {
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

                // Check status immediately (should be pending)
                const status = await getCallsStatus(smartClient, {
                    id: userOpHash
                })

                expect(status).toBeTruthy()
                expect(status.id).toBe(userOpHash)
                expect(status.version).toBe("1.0")
                expect(status.chainId).toBe(smartClient.chain.id)
                expect(status.atomic).toBe(true)
                expect(["pending", "success"]).toContain(status.status)
                expect([100, 200]).toContain(status.statusCode)
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "getCallsStatus_v07",
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

                await smartClient.waitForUserOperationReceipt({
                    hash: userOpHash as Hex
                })

                const status = await getCallsStatus(smartClient, {
                    id: userOpHash
                })

                expect(status).toBeTruthy()
                expect(status.id).toBe(userOpHash)
                expect(status.version).toBe("1.0")
                expect(status.chainId).toBe(smartClient.chain.id)
                expect(status.atomic).toBe(true)
                expect(status.status).toBe("success")
                expect(status.statusCode).toBe(200)
                expect(status.receipts).toBeDefined()
                expect(status.receipts?.length).toBeGreaterThan(0)
                expect(status.receipts?.[0].status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV08)(
            "getCallsStatus_v08",
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

                await smartClient.waitForUserOperationReceipt({
                    hash: userOpHash as Hex
                })

                const status = await getCallsStatus(smartClient, {
                    id: userOpHash
                })

                expect(status).toBeTruthy()
                expect(status.id).toBe(userOpHash)
                expect(status.version).toBe("1.0")
                expect(status.chainId).toBe(smartClient.chain.id)
                expect(status.atomic).toBe(true)
                expect(status.status).toBe("success")
                expect(status.statusCode).toBe(200)
                expect(status.receipts).toBeDefined()
                expect(status.receipts?.length).toBeGreaterThan(0)
                expect(status.receipts?.[0].status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV06)(
            "getCallsStatus_v06 with invalid hash",
            async ({ rpc }) => {
                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.6"
                    },
                    ...rpc
                })

                const invalidHash =
                    "0x1234567890123456789012345678901234567890123456789012345678901234"

                const status = await getCallsStatus(smartClient, {
                    id: invalidHash
                })

                expect(status).toBeTruthy()
                expect(status.id).toBe(invalidHash)
                expect(status.version).toBe("1.0")
                expect(status.chainId).toBe(smartClient.chain.id)
                expect(status.atomic).toBe(true)
                expect(status.status).toBe("pending")
                expect(status.statusCode).toBe(100)
                expect(status.receipts).toBeUndefined()
            }
        )
    }
)
