import {
    decodeFunctionData,
    encodeFunctionData,
    erc20Abi,
    zeroAddress
} from "viem"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../permissionless-test/src/testWithRpc"
import { getCoreSmartAccounts } from "../../permissionless-test/src/utils"

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

                    const erc20TransactionData = encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "transfer",
                        args: [zeroAddress, 1000000000000000000n]
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

                    const erc20TransactionData = encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "transfer",
                        args: [zeroAddress, 1000000000000000000n]
                    })

                    const callData = await smartClient.account.encodeCalls([
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        },
                        {
                            to: zeroAddress,
                            data: erc20TransactionData,
                            value: 10n
                        }
                    ])

                    if (!smartClient.account.decodeCalls) {
                        throw new Error("decodeCalls is not supported")
                    }

                    const decoded =
                        await smartClient.account.decodeCalls(callData)

                    expect(decoded).toEqual([
                        { to: zeroAddress, data: "0x", value: 0n },
                        {
                            to: zeroAddress,
                            data: erc20TransactionData,
                            value: name === "Simple" ? 0n : 10n
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

                    const erc20TransactionData = encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "transfer",
                        args: [zeroAddress, 1000000000000000000n]
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

                const erc20TransactionData = encodeFunctionData({
                    abi: erc20Abi,
                    functionName: "transfer",
                    args: [zeroAddress, 1000000000000000000n]
                })

                const callData = await smartClient.account.encodeCalls([
                    {
                        to: zeroAddress,
                        data: "0x",
                        value: 0n
                    },
                    {
                        to: zeroAddress,
                        data: erc20TransactionData,
                        value: 10n
                    }
                ])

                if (!smartClient.account.decodeCalls) {
                    throw new Error("decodeCalls is not supported")
                }

                const decoded = await smartClient.account.decodeCalls(callData)

                expect(decoded).toEqual([
                    { to: zeroAddress, data: "0x", value: 0n },
                    { to: zeroAddress, data: erc20TransactionData, value: 10n }
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

                    const erc20TransactionData = encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "transfer",
                        args: [zeroAddress, 1000000000000000000n]
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

                const erc20TransactionData = encodeFunctionData({
                    abi: erc20Abi,
                    functionName: "transfer",
                    args: [zeroAddress, 1000000000000000000n]
                })

                const callData = await smartClient.account.encodeCalls([
                    {
                        to: zeroAddress,
                        data: "0x",
                        value: 0n
                    },
                    {
                        to: zeroAddress,
                        data: erc20TransactionData,
                        value: 10n
                    }
                ])

                if (!smartClient.account.decodeCalls) {
                    throw new Error("decodeCalls is not supported")
                }

                const decoded = await smartClient.account.decodeCalls(callData)

                expect(decoded).toEqual([
                    { to: zeroAddress, data: "0x", value: 0n },
                    { to: zeroAddress, data: erc20TransactionData, value: 10n }
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
        })
    }
)
