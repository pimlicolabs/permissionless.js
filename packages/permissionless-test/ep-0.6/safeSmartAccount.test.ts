import dotenv from "dotenv"
import { SignTransactionNotSupportedBySmartAccount } from "permissionless/accounts"
import { verifyMessage } from "permissionless/actions"
import {
    http,
    Account,
    Address,
    BaseError,
    Chain,
    Transport,
    WalletClient,
    createWalletClient,
    decodeEventLog,
    getContract,
    hashMessage,
    hashTypedData,
    zeroAddress
} from "viem"
import {
    beforeAll,
    beforeEach,
    describe,
    expect,
    expectTypeOf,
    test
} from "vitest"
import { EntryPointAbi } from "../abis/EntryPoint"
import { GreeterAbi, GreeterBytecode } from "../abis/Greeter"
import {
    generateApproveCallData,
    getBundlerClient,
    getEntryPoint,
    getPimlicoBundlerClient,
    getPimlicoPaymasterClient,
    getPrivateKeyAccount,
    getPublicClient,
    getSignerToSafeSmartAccount,
    getSmartAccountClient,
    getTestingChain,
    refillSmartAccount,
    waitForNonceUpdate
} from "./utils"

dotenv.config()

beforeAll(() => {
    if (!process.env.FACTORY_ADDRESS) {
        throw new Error("FACTORY_ADDRESS environment variable not set")
    }
    if (!process.env.TEST_PRIVATE_KEY) {
        throw new Error("TEST_PRIVATE_KEY environment variable not set")
    }
    if (!process.env.RPC_URL) {
        throw new Error("RPC_URL environment variable not set")
    }
})

describe("Safe Account", () => {
    let walletClient: WalletClient<Transport, Chain, Account>

    beforeEach(async () => {
        const owner = getPrivateKeyAccount()
        walletClient = createWalletClient({
            account: owner,
            chain: getTestingChain(),
            transport: http(process.env.RPC_URL as string)
        })
    })

    test("Safe Account address", async () => {
        const safeSmartAccount = await getSignerToSafeSmartAccount()

        expectTypeOf(safeSmartAccount.address).toBeString()
        expect(safeSmartAccount.address).toHaveLength(42)
        expect(safeSmartAccount.address).toMatch(/^0x[0-9a-fA-F]{40}$/)

        await expect(async () =>
            safeSmartAccount.signTransaction({
                to: zeroAddress,
                value: 0n,
                data: "0x"
            })
        ).rejects.toThrow(SignTransactionNotSupportedBySmartAccount)
    })

    test("safe smart account client deploy contract", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount()
        })

        await expect(() =>
            smartAccountClient.deployContract({
                abi: GreeterAbi,
                bytecode: GreeterBytecode
            })
        ).rejects.toThrowError(/doesn't support account deployment/)
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
            middleware: {
                sponsorUserOperation: pimlicoPaymaster.sponsorUserOperation
            }
        })

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expectTypeOf(response).toBeString()
        expect(response).toHaveLength(66)
        expect(response).toMatch(/^0x[0-9a-fA-F]{64}$/)
    }, 1000000)

    test("safe Smart account write contract", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount()
        })

        await refillSmartAccount(
            walletClient,
            smartAccountClient.account.address
        )

        const entryPointContract = getContract({
            abi: EntryPointAbi,
            address: getEntryPoint(),
            client: {
                public: await getPublicClient(),
                wallet: smartAccountClient
            }
        })

        const oldBalance = await entryPointContract.read.balanceOf([
            smartAccountClient.account.address
        ])

        const txHash = await entryPointContract.write.depositTo(
            [smartAccountClient.account.address],
            {
                value: 10n
            }
        )

        expectTypeOf(txHash).toBeString()
        expect(txHash).toHaveLength(66)

        const newBalnce = await entryPointContract.read.balanceOf([
            smartAccountClient.account.address
        ])

        await waitForNonceUpdate()
    }, 1000000)

    test("safe Smart account client send multiple transactions", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount()
        })
        await refillSmartAccount(
            walletClient,
            smartAccountClient.account.address
        )

        const pimlicoBundlerClient = getPimlicoBundlerClient()

        const gasPrice = await pimlicoBundlerClient.getUserOperationGasPrice()

        const response = await smartAccountClient.sendTransactions({
            transactions: [
                {
                    to: smartAccountClient.account.address,
                    value: 10n,
                    data: "0x"
                },
                {
                    to: smartAccountClient.account.address,
                    value: 10n,
                    data: "0x"
                }
            ],
            maxFeePerGas: gasPrice.fast.maxFeePerGas,
            maxPriorityFeePerGas: gasPrice.fast.maxPriorityFeePerGas
        })
        expectTypeOf(response).toBeString()
        expect(response).toHaveLength(66)
        expect(response).toMatch(/^0x[0-9a-fA-F]{64}$/)
        await waitForNonceUpdate()
    }, 1000000)

    test("safe Smart account client send transaction", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount()
        })
        await refillSmartAccount(
            walletClient,
            smartAccountClient.account.address
        )
        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })
        expectTypeOf(response).toBeString()
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
            middleware: {
                sponsorUserOperation: pimlicoPaymaster.sponsorUserOperation
            }
        })

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expectTypeOf(response).toBeString()
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

        expect(eventFound).toBeTruthy()
        await waitForNonceUpdate()
    }, 1000000)

    test("safe smart account client send Transaction with paymaster", async () => {
        const publicClient = await getPublicClient()

        const bundlerClient = getBundlerClient()
        const pimlicoPaymaster = getPimlicoPaymasterClient()

        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount(),
            middleware: {
                sponsorUserOperation: pimlicoPaymaster.sponsorUserOperation
            }
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

        expectTypeOf(response).toBeString()
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

        expect(eventFound).toBeTruthy()
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

        expectTypeOf(signature).toBeString()
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

        expect(response).toBe("0x1626ba7e")
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

        expectTypeOf(signature).toBeString()
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

        expect(response).toBe("0x1626ba7e")
    })

    test("verifySignature", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToSafeSmartAccount({
                saltNonce: 1n
            })
        })
        const message = "hello world"

        const signature = await smartAccountClient.signMessage({
            message
        })

        const publicClient = await getPublicClient()

        const isVerified = await verifyMessage(publicClient, {
            address: smartAccountClient.account.address,
            message,
            signature
        })

        expect(isVerified).toBe(true)
    })
})
