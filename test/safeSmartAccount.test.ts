import { beforeAll, describe, expect, test } from "bun:test"
import dotenv from "dotenv"
import { SignTransactionNotSupportedBySmartAccount } from "permissionless/accounts"
import {
    Address,
    BaseError,
    decodeEventLog,
    getContract,
    hashMessage,
    hashTypedData,
    zeroAddress
} from "viem"
import { EntryPointAbi } from "./abis/EntryPoint.js"
import { GreeterAbi, GreeterBytecode } from "./abis/Greeter.js"
import {
    generateApproveCallData,
    getBundlerClient,
    getPimlicoBundlerClient,
    getPimlicoPaymasterClient,
    getPublicClient,
    getSignerToSafeSmartAccount,
    getSmartAccountClient,
    waitForNonceUpdate
} from "./utils.js"

dotenv.config()

beforeAll(() => {
    if (!process.env.STACKUP_API_KEY) {
        throw new Error("STACKUP_API_KEY environment variable not set")
    }
    if (!process.env.FACTORY_ADDRESS) {
        throw new Error("FACTORY_ADDRESS environment variable not set")
    }
    if (!process.env.TEST_PRIVATE_KEY) {
        throw new Error("TEST_PRIVATE_KEY environment variable not set")
    }
    if (!process.env.RPC_URL) {
        throw new Error("RPC_URL environment variable not set")
    }
    if (!process.env.ENTRYPOINT_ADDRESS) {
        throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
    }

    if (!process.env.GREETER_ADDRESS) {
        throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
    }
})

describe("Safe Account", () => {
    test("Safe Account address", async () => {
        const safeSmartAccount = await getSignerToSafeSmartAccount()

        expect(safeSmartAccount.address).toBeString()
        expect(safeSmartAccount.address).toHaveLength(42)
        expect(safeSmartAccount.address).toMatch(/^0x[0-9a-fA-F]{40}$/)

        expect(async () => {
            await safeSmartAccount.signTransaction({
                to: zeroAddress,
                value: 0n,
                data: "0x"
            })
        }).toThrow(new SignTransactionNotSupportedBySmartAccount())
    })

    test("safe smart account client deploy contract", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount()
        })

        expect(async () => {
            await smartAccountClient.deployContract({
                abi: GreeterAbi,
                bytecode: GreeterBytecode
            })
        }).toThrow("Safe account doesn't support account deployment")
    })

    test("safe Smart account deploy with setup Txs", async () => {
        const pimlicoPaymaster = getPimlicoPaymasterClient()

        const usdcTokenAddress = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"
        const erc20PaymasterAddress =
            "0xEc43912D8C772A0Eba5a27ea5804Ba14ab502009"

        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount({
                setupTransactions: [
                    {
                        to: usdcTokenAddress,
                        data: generateApproveCallData(erc20PaymasterAddress),
                        value: 0n
                    }
                ]
            }),
            sponsorUserOperation: pimlicoPaymaster.sponsorUserOperation
        })

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expect(response).toBeString()
        expect(response).toHaveLength(66)
        expect(response).toMatch(/^0x[0-9a-fA-F]{64}$/)
    }, 1000000)

    test("safe Smart account write contract", async () => {
        const greeterContract = getContract({
            abi: GreeterAbi,
            address: process.env.GREETER_ADDRESS as Address,
            client: {
                public: await getPublicClient(),
                wallet: await getSmartAccountClient({
                    account: await getSignerToSafeSmartAccount()
                })
            }
        })

        const oldGreet = await greeterContract.read.greet()

        expect(oldGreet).toBeString()

        const txHash = await greeterContract.write.setGreeting(["hello world"])

        expect(txHash).toBeString()
        expect(txHash).toHaveLength(66)

        const newGreet = await greeterContract.read.greet()

        expect(newGreet).toBeString()
        expect(newGreet).toEqual("hello world")
        await waitForNonceUpdate()
    }, 1000000)

    test("safe Smart account client send multiple transactions", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount()
        })

        const pimlicoBundlerClient = getPimlicoBundlerClient()

        const gasPrices = await pimlicoBundlerClient.getUserOperationGasPrice()

        const response = await smartAccountClient.sendTransactions({
            transactions: [
                {
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                },
                {
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                }
            ],
            maxFeePerGas: gasPrices.fast.maxFeePerGas,
            maxPriorityFeePerGas: gasPrices.fast.maxPriorityFeePerGas
        })
        expect(response).toBeString()
        expect(response).toHaveLength(66)
        expect(response).toMatch(/^0x[0-9a-fA-F]{64}$/)
        await waitForNonceUpdate()
    }, 1000000)

    test("safe Smart account client send transaction", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount()
        })
        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })
        expect(response).toBeString()
        expect(response).toHaveLength(66)
        expect(response).toMatch(/^0x[0-9a-fA-F]{64}$/)

        await new Promise((res) => {
            setTimeout(res, 1000)
        })
        await waitForNonceUpdate()
    }, 1000000)

    test("safe smart account client send Transaction with paymaster", async () => {
        const publicClient = await getPublicClient()

        const pimlicoPaymaster = getPimlicoPaymasterClient()

        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount(),
            sponsorUserOperation: pimlicoPaymaster.sponsorUserOperation
        })

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expect(response).toBeString()
        expect(response).toHaveLength(66)
        expect(response).toMatch(/^0x[0-9a-fA-F]{64}$/)

        const transactionReceipt = await publicClient.waitForTransactionReceipt(
            {
                hash: response
            }
        )

        let eventFound = false

        const bundlerClient = getBundlerClient()
        for (const log of transactionReceipt.logs) {
            try {
                const event = decodeEventLog({
                    abi: EntryPointAbi,
                    ...log
                })
                if (event.eventName === "UserOperationEvent") {
                    eventFound = true
                    const userOperation =
                        await bundlerClient.getUserOperationByHash({
                            hash: event.args.userOpHash
                        })
                    expect(
                        userOperation?.userOperation.paymasterAndData
                    ).not.toBe("0x")
                }
            } catch (e) {
                const error = e as BaseError
                if (error.name !== "AbiEventSignatureNotFoundError") throw e
            }
        }

        expect(eventFound).toBeTrue()
        await waitForNonceUpdate()
    }, 1000000)

    test("safe smart account client send Transaction with paymaster", async () => {
        const publicClient = await getPublicClient()

        const bundlerClient = getBundlerClient()
        const pimlicoPaymaster = getPimlicoPaymasterClient()

        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount(),
            sponsorUserOperation: pimlicoPaymaster.sponsorUserOperation
        })

        const response = await smartAccountClient.sendTransactions({
            transactions: [
                {
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                },
                {
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                }
            ]
        })

        expect(response).toBeString()
        expect(response).toHaveLength(66)
        expect(response).toMatch(/^0x[0-9a-fA-F]{64}$/)

        const transactionReceipt = await publicClient.waitForTransactionReceipt(
            {
                hash: response
            }
        )

        let eventFound = false

        for (const log of transactionReceipt.logs) {
            try {
                const event = decodeEventLog({
                    abi: EntryPointAbi,
                    ...log
                })
                if (event.eventName === "UserOperationEvent") {
                    eventFound = true
                    const userOperation =
                        await bundlerClient.getUserOperationByHash({
                            hash: event.args.userOpHash
                        })
                    expect(
                        userOperation?.userOperation.paymasterAndData
                    ).not.toBe("0x")
                }
            } catch (e) {
                const error = e as BaseError
                if (error.name !== "AbiEventSignatureNotFoundError") throw e
            }
        }

        expect(eventFound).toBeTrue()
        await waitForNonceUpdate()
    }, 1000000)

    test("safe Smart account client signMessage", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount()
        })

        const messageToSign = "hello world"
        const signature = await smartAccountClient.signMessage({
            message: messageToSign
        })

        expect(signature).toBeString()
        expect(signature).toHaveLength(132)
        expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/)

        const publicClient = await getPublicClient()

        const response = await publicClient.readContract({
            address: smartAccountClient.account.address,
            abi: [
                {
                    inputs: [
                        {
                            internalType: "bytes",
                            name: "_data",
                            type: "bytes"
                        },
                        {
                            internalType: "bytes",
                            name: "_signature",
                            type: "bytes"
                        }
                    ],
                    name: "isValidSignature",
                    outputs: [
                        {
                            internalType: "bytes4",
                            name: "",
                            type: "bytes4"
                        }
                    ],
                    stateMutability: "view",
                    type: "function"
                },
                {
                    inputs: [
                        {
                            internalType: "bytes32",
                            name: "_dataHash",
                            type: "bytes32"
                        },
                        {
                            internalType: "bytes",
                            name: "_signature",
                            type: "bytes"
                        }
                    ],
                    name: "isValidSignature",
                    outputs: [
                        {
                            internalType: "bytes4",
                            name: "",
                            type: "bytes4"
                        }
                    ],
                    stateMutability: "view",
                    type: "function"
                }
            ],
            functionName: "isValidSignature",
            args: [hashMessage(messageToSign), signature]
        })

        expect(response).toBe("0x20c13b0b")
    })

    test("safe Smart account client signTypedData", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount()
        })

        const signature = await smartAccountClient.signTypedData({
            domain: {
                chainId: 1,
                name: "Test",
                verifyingContract: zeroAddress
            },
            primaryType: "Test",
            types: {
                Test: [
                    {
                        name: "test",
                        type: "string"
                    }
                ]
            },
            message: {
                test: "hello world"
            }
        })

        expect(signature).toBeString()
        expect(signature).toHaveLength(132)
        expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/)

        const publicClient = await getPublicClient()

        const response = await publicClient.readContract({
            address: smartAccountClient.account.address,
            abi: [
                {
                    inputs: [
                        {
                            internalType: "bytes",
                            name: "_data",
                            type: "bytes"
                        },
                        {
                            internalType: "bytes",
                            name: "_signature",
                            type: "bytes"
                        }
                    ],
                    name: "isValidSignature",
                    outputs: [
                        {
                            internalType: "bytes4",
                            name: "",
                            type: "bytes4"
                        }
                    ],
                    stateMutability: "view",
                    type: "function"
                },
                {
                    inputs: [
                        {
                            internalType: "bytes32",
                            name: "_dataHash",
                            type: "bytes32"
                        },
                        {
                            internalType: "bytes",
                            name: "_signature",
                            type: "bytes"
                        }
                    ],
                    name: "isValidSignature",
                    outputs: [
                        {
                            internalType: "bytes4",
                            name: "",
                            type: "bytes4"
                        }
                    ],
                    stateMutability: "view",
                    type: "function"
                }
            ],
            functionName: "isValidSignature",
            args: [
                hashTypedData({
                    domain: {
                        chainId: 1,
                        name: "Test",
                        verifyingContract: zeroAddress
                    },
                    primaryType: "Test",
                    types: {
                        Test: [
                            {
                                name: "test",
                                type: "string"
                            }
                        ]
                    },
                    message: {
                        test: "hello world"
                    }
                }),
                signature
            ]
        })

        expect(response).toBe("0x20c13b0b")
    })
})
