import {
    type Address,
    type Hex,
    decodeFunctionData,
    encodeFunctionData,
    erc20Abi,
    zeroAddress
} from "viem"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../permissionless-test/src/testWithRpc"
import { getCoreSmartAccounts } from "../../permissionless-test/src/utils"

const erc20TransactionData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [zeroAddress, 1000000000000000000n]
})

const erc20ApproveData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [zeroAddress, 500000000000000000n]
})

// Distinct targets, more than two calls, and empty data both in the middle
// and at the end of the batch
const multipleCalls: { to: Address; data: Hex; value: bigint }[] = [
    {
        to: "0x1111111111111111111111111111111111111111",
        data: erc20ApproveData,
        value: 0n
    },
    {
        to: "0x2222222222222222222222222222222222222222",
        data: "0x",
        value: 0n
    },
    {
        to: "0x3333333333333333333333333333333333333333",
        data: erc20TransactionData,
        value: 10n
    },
    {
        to: "0x4444444444444444444444444444444444444444",
        data: "0x",
        value: 0n
    }
]

describe.each(getCoreSmartAccounts())(
    "decodeCalls $name",
    ({ getSmartAccountClient, name, supportsEntryPointV06 }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "decodeCalls v0.6 single call with no data",
            async ({ rpc }) => {
                try {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.6"
                        },
                        ...rpc
                    })

                    const callData = await smartClient.account.encodeCalls([
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ])

                    if (!smartClient.account.decodeCalls) {
                        throw new Error("decodeCalls is not supported")
                    }

                    const decoded =
                        await smartClient.account.decodeCalls(callData)

                    expect(decoded).toEqual([
                        { to: zeroAddress, data: "0x", value: 0n }
                    ])
                } catch (e) {
                    if (
                        e instanceof Error &&
                        e.message === "Kernel ERC7579 is not supported for V06"
                    ) {
                        return // Expected error for ERC7579 accounts with v0.6
                    }
                    throw e
                }
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV06)(
            "decodeCalls v0.6 single call with data",
            async ({ rpc }) => {
                try {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.6"
                        },
                        ...rpc
                    })

                    const callData = await smartClient.account.encodeCalls([
                        {
                            to: zeroAddress,
                            data: erc20TransactionData,
                            value: 0n
                        }
                    ])

                    if (!smartClient.account.decodeCalls) {
                        throw new Error("decodeCalls is not supported")
                    }

                    const decoded =
                        await smartClient.account.decodeCalls(callData)

                    expect(decoded).toEqual([
                        {
                            to: zeroAddress,
                            data: erc20TransactionData,
                            value: 0n
                        }
                    ])

                    const decodeErc20TransactionData = decodeFunctionData({
                        abi: erc20Abi,
                        data: erc20TransactionData
                    })

                    expect(decodeErc20TransactionData.args).toEqual([
                        zeroAddress,
                        1000000000000000000n
                    ])
                } catch (e) {
                    if (
                        e instanceof Error &&
                        e.message === "Kernel ERC7579 is not supported for V06"
                    ) {
                        return // Expected error for ERC7579 accounts with v0.6
                    }
                    throw e
                }
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV06)(
            "decodeCalls v0.6 multiple calls",
            async ({ rpc }) => {
                try {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.6"
                        },
                        ...rpc
                    })

                    const callData =
                        await smartClient.account.encodeCalls(multipleCalls)

                    if (!smartClient.account.decodeCalls) {
                        throw new Error("decodeCalls is not supported")
                    }

                    const decoded =
                        await smartClient.account.decodeCalls(callData)

                    expect(decoded).toEqual(
                        multipleCalls.map((call) =>
                            name === "Simple" ? { ...call, value: 0n } : call
                        )
                    )

                    const decodeErc20TransactionData = decodeFunctionData({
                        abi: erc20Abi,
                        data: erc20TransactionData
                    })

                    expect(decodeErc20TransactionData.args).toEqual([
                        zeroAddress,
                        1000000000000000000n
                    ])
                } catch (e) {
                    if (
                        e instanceof Error &&
                        e.message === "Kernel ERC7579 is not supported for V06"
                    ) {
                        return // Expected error for ERC7579 accounts with v0.6
                    }
                    throw e
                }
            }
        )

        testWithRpc(
            "decodeCalls v0.7 single call with no data",
            async ({ rpc }) => {
                try {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        ...rpc
                    })

                    const callData = await smartClient.account.encodeCalls([
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ])

                    if (!smartClient.account.decodeCalls) {
                        throw new Error("decodeCalls is not supported")
                    }

                    const decoded =
                        await smartClient.account.decodeCalls(callData)

                    expect(decoded).toEqual([
                        { to: zeroAddress, data: "0x", value: 0n }
                    ])
                } catch (e) {
                    if (
                        e instanceof Error &&
                        e.message === "Kernel ERC7579 is not supported for V06"
                    ) {
                        return // Expected error for ERC7579 accounts with v0.6
                    }
                    throw e
                }
            }
        )

        testWithRpc(
            "decodeCalls v0.7 single call with data",
            async ({ rpc }) => {
                try {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        ...rpc
                    })

                    const callData = await smartClient.account.encodeCalls([
                        {
                            to: zeroAddress,
                            data: erc20TransactionData,
                            value: 0n
                        }
                    ])

                    if (!smartClient.account.decodeCalls) {
                        throw new Error("decodeCalls is not supported")
                    }

                    const decoded =
                        await smartClient.account.decodeCalls(callData)

                    expect(decoded).toEqual([
                        {
                            to: zeroAddress,
                            data: erc20TransactionData,
                            value: 0n
                        }
                    ])

                    const decodeErc20TransactionData = decodeFunctionData({
                        abi: erc20Abi,
                        data: erc20TransactionData
                    })

                    expect(decodeErc20TransactionData.args).toEqual([
                        zeroAddress,
                        1000000000000000000n
                    ])
                } catch (e) {
                    if (
                        e instanceof Error &&
                        e.message === "Kernel ERC7579 is not supported for V06"
                    ) {
                        return // Expected error for ERC7579 accounts with v0.6
                    }
                    throw e
                }
            }
        )

        testWithRpc("decodeCalls v0.7 multiple calls", async ({ rpc }) => {
            try {
                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                const callData =
                    await smartClient.account.encodeCalls(multipleCalls)

                if (!smartClient.account.decodeCalls) {
                    throw new Error("decodeCalls is not supported")
                }

                const decoded = await smartClient.account.decodeCalls(callData)

                expect(decoded).toEqual(multipleCalls)

                const decodeErc20TransactionData = decodeFunctionData({
                    abi: erc20Abi,
                    data: erc20TransactionData
                })

                expect(decodeErc20TransactionData.args).toEqual([
                    zeroAddress,
                    1000000000000000000n
                ])
            } catch (e) {
                if (
                    e instanceof Error &&
                    e.message === "Kernel ERC7579 is not supported for V06"
                ) {
                    return // Expected error for ERC7579 accounts with v0.6
                }
                throw e
            }
        })

        testWithRpc(
            "decodeCalls v0.8 single call with no data",
            async ({ rpc }) => {
                try {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.8"
                        },
                        ...rpc
                    })

                    const callData = await smartClient.account.encodeCalls([
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ])

                    if (!smartClient.account.decodeCalls) {
                        throw new Error("decodeCalls is not supported")
                    }

                    const decoded =
                        await smartClient.account.decodeCalls(callData)

                    expect(decoded).toEqual([
                        { to: zeroAddress, data: "0x", value: 0n }
                    ])
                } catch (e) {
                    if (
                        e instanceof Error &&
                        e.message === "Kernel ERC7579 is not supported for V06"
                    ) {
                        return // Expected error for ERC7579 accounts with v0.6
                    }
                    throw e
                }
            }
        )

        testWithRpc(
            "decodeCalls v0.8 single call with data",
            async ({ rpc }) => {
                try {
                    const smartClient = await getSmartAccountClient({
                        entryPoint: {
                            version: "0.8"
                        },
                        ...rpc
                    })

                    const callData = await smartClient.account.encodeCalls([
                        {
                            to: zeroAddress,
                            data: erc20TransactionData,
                            value: 0n
                        }
                    ])

                    if (!smartClient.account.decodeCalls) {
                        throw new Error("decodeCalls is not supported")
                    }

                    const decoded =
                        await smartClient.account.decodeCalls(callData)

                    expect(decoded).toEqual([
                        {
                            to: zeroAddress,
                            data: erc20TransactionData,
                            value: 0n
                        }
                    ])

                    const decodeErc20TransactionData = decodeFunctionData({
                        abi: erc20Abi,
                        data: erc20TransactionData
                    })

                    expect(decodeErc20TransactionData.args).toEqual([
                        zeroAddress,
                        1000000000000000000n
                    ])
                } catch (e) {
                    if (
                        e instanceof Error &&
                        e.message === "Kernel ERC7579 is not supported for V06"
                    ) {
                        return // Expected error for ERC7579 accounts with v0.6
                    }
                    throw e
                }
            }
        )

        testWithRpc("decodeCalls v0.8 multiple calls", async ({ rpc }) => {
            try {
                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.8"
                    },
                    ...rpc
                })

                const callData =
                    await smartClient.account.encodeCalls(multipleCalls)

                if (!smartClient.account.decodeCalls) {
                    throw new Error("decodeCalls is not supported")
                }

                const decoded = await smartClient.account.decodeCalls(callData)

                expect(decoded).toEqual(multipleCalls)

                const decodeErc20TransactionData = decodeFunctionData({
                    abi: erc20Abi,
                    data: erc20TransactionData
                })

                expect(decodeErc20TransactionData.args).toEqual([
                    zeroAddress,
                    1000000000000000000n
                ])
            } catch (e) {
                if (
                    e instanceof Error &&
                    e.message === "Kernel ERC7579 is not supported for V06"
                ) {
                    return // Expected error for ERC7579 accounts with v0.6
                }
                throw e
            }
        })
    }
)
