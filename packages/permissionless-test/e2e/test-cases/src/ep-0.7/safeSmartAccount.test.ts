import { type BundlerClient, ENTRYPOINT_ADDRESS_V07 } from "permissionless"
import { SignTransactionNotSupportedBySmartAccount } from "permissionless/accounts"
import type { PimlicoBundlerClient } from "permissionless/clients/pimlico"
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types"
import {
    type Account,
    type BaseError,
    type Chain,
    type PublicClient,
    type Transport,
    type WalletClient,
    decodeEventLog,
    getContract,
    hashMessage,
    hashTypedData,
    isAddress,
    isHash,
    parseEther,
    zeroAddress
} from "viem"
import { ENTRYPOINT_V07_ABI } from "../../abi/entryPointV07Abi"
import {
    fund,
    getAnvilWalletClient,
    getBundlerClient,
    getPimlicoBundlerClient,
    getPimlicoPaymasterClient,
    getPublicClient,
    getSafeClient
} from "../utils"

describe("Safe Account", () => {
    let publicClient: PublicClient<Transport, Chain>
    let walletClient: WalletClient<Transport, Chain, Account>
    let bundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE, Chain>
    let pimlicoBundlerClient: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>

    beforeAll(async () => {
        publicClient = getPublicClient()
        walletClient = getAnvilWalletClient(98)
        bundlerClient = getBundlerClient(ENTRYPOINT_ADDRESS_V07)
        pimlicoBundlerClient = getPimlicoBundlerClient(ENTRYPOINT_ADDRESS_V07)
    })

    test("signTransaction should throw", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })
        const smartAccount = smartAccountClient.account

        expect(isAddress(smartAccount.address)).toBe(true)

        await expect(async () =>
            smartAccount.signTransaction({
                to: zeroAddress,
                value: 0n,
                data: "0x"
            })
        ).rejects.toThrow(SignTransactionNotSupportedBySmartAccount)
    })

    test("attempt at deploying contract should throw", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        await expect(() =>
            smartAccountClient.deployContract({
                bytecode: "0x30ff",
                abi: []
            })
        ).rejects.toThrowError(/doesn't support account deployment/)
    })

    test("can deploy with setup transaction", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            setupTransactions: [
                {
                    to: zeroAddress,
                    data: "0xff",
                    value: 0n
                }
            ],
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V07)
        })

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expect(isHash(response)).toBe(true)
    }, 1000000)

    test("can write contract", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        await fund(smartAccountClient.account.address, walletClient)

        const entryPointContract = getContract({
            abi: ENTRYPOINT_V07_ABI,
            address: ENTRYPOINT_ADDRESS_V07,
            client: {
                public: publicClient,
                wallet: smartAccountClient
            }
        })

        const oldBalance = await entryPointContract.read.balanceOf([
            smartAccountClient.account.address
        ])

        const txHash = await entryPointContract.write.depositTo(
            [smartAccountClient.account.address],
            {
                value: parseEther("0.25")
            }
        )

        expect(isHash(txHash)).toBeTruthy()

        const newBalance = await entryPointContract.read.balanceOf([
            smartAccountClient.account.address
        ])

        expect(newBalance - oldBalance).toBeGreaterThanOrEqual(
            parseEther("0.25")
        )
    }, 1000000)

    test("can send multiple transactions", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        await fund(smartAccountClient.account.address, walletClient)

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

        expect(isHash(response)).toBe(true)
    }, 1000000)

    test("can send transaction", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        await fund(smartAccountClient.account.address, walletClient)

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expect(isHash(response)).toBe(true)
    }, 1000000)

    test("can send transaction with paymaster", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V07)
        })

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expect(isHash(response)).toBe(true)

        const transactionReceipt = await publicClient.waitForTransactionReceipt(
            {
                hash: response
            }
        )

        let eventFound = false

        for (const log of transactionReceipt.logs) {
            try {
                // biome-ignore lint/suspicious/noExplicitAny:
                let event: any
                try {
                    event = decodeEventLog({
                        abi: ENTRYPOINT_V07_ABI,
                        ...log
                    })
                } catch {
                    continue
                }
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
    }, 1000000)

    test("can send multiple transaction with paymaster", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V07)
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

        expect(isHash(response)).toBe(true)

        const transactionReceipt = await publicClient.waitForTransactionReceipt(
            {
                hash: response
            }
        )

        let eventFound = false

        for (const log of transactionReceipt.logs) {
            try {
                // biome-ignore lint/suspicious/noExplicitAny:
                let event: any
                try {
                    event = decodeEventLog({
                        abi: ENTRYPOINT_V07_ABI,
                        ...log
                    })
                } catch {
                    continue
                }
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
    }, 1000000)

    //test("can signMessage", async () => {
    //    const smartAccountClient = await setupSafeSmartAccountClient({
    //        entryPoint: ENTRYPOINT_ADDRESS_V07
    //    })

    //    const messageToSign = "hello world"
    //    const signature = await smartAccountClient.signMessage({
    //        message: messageToSign
    //    })

    //    console.log(`signature: ${signature}`)

    //    expect(isHash(signature)).toBe(true)

    //    const publicClient = getPublicClient()

    //    const response = await publicClient.readContract({
    //        address: smartAccountClient.account.address,
    //        abi: [
    //            {
    //                inputs: [
    //                    {
    //                        internalType: "bytes",
    //                        name: "_data",
    //                        type: "bytes"
    //                    },
    //                    {
    //                        internalType: "bytes",
    //                        name: "_signature",
    //                        type: "bytes"
    //                    }
    //                ],
    //                name: "isValidSignature",
    //                outputs: [
    //                    {
    //                        internalType: "bytes4",
    //                        name: "",
    //                        type: "bytes4"
    //                    }
    //                ],
    //                stateMutability: "view",
    //                type: "function"
    //            },
    //            {
    //                inputs: [
    //                    {
    //                        internalType: "bytes32",
    //                        name: "_dataHash",
    //                        type: "bytes32"
    //                    },
    //                    {
    //                        internalType: "bytes",
    //                        name: "_signature",
    //                        type: "bytes"
    //                    }
    //                ],
    //                name: "isValidSignature",
    //                outputs: [
    //                    {
    //                        internalType: "bytes4",
    //                        name: "",
    //                        type: "bytes4"
    //                    }
    //                ],
    //                stateMutability: "view",
    //                type: "function"
    //            }
    //        ],
    //        functionName: "isValidSignature",
    //        args: [hashMessage(messageToSign), signature]
    //    })

    //    expect(response).toBe("0x1626ba7e")
    //})

    //test("can sign TypedData", async () => {
    //    const smartAccountClient = await setupSafeSmartAccountClient({
    //        entryPoint: ENTRYPOINT_ADDRESS_V07
    //    })

    //    const signature = await smartAccountClient.signTypedData({
    //        domain: {
    //            chainId: 1,
    //            name: "Test",
    //            verifyingContract: zeroAddress
    //        },
    //        primaryType: "Test",
    //        types: {
    //            Test: [
    //                {
    //                    name: "test",
    //                    type: "string"
    //                }
    //            ]
    //        },
    //        message: {
    //            test: "hello world"
    //        }
    //    })

    //    expect(isHash(signature)).toBe(true)

    //    const response = await publicClient.readContract({
    //        address: smartAccountClient.account.address,
    //        abi: [
    //            {
    //                inputs: [
    //                    {
    //                        internalType: "bytes",
    //                        name: "_data",
    //                        type: "bytes"
    //                    },
    //                    {
    //                        internalType: "bytes",
    //                        name: "_signature",
    //                        type: "bytes"
    //                    }
    //                ],
    //                name: "isValidSignature",
    //                outputs: [
    //                    {
    //                        internalType: "bytes4",
    //                        name: "",
    //                        type: "bytes4"
    //                    }
    //                ],
    //                stateMutability: "view",
    //                type: "function"
    //            },
    //            {
    //                inputs: [
    //                    {
    //                        internalType: "bytes32",
    //                        name: "_dataHash",
    //                        type: "bytes32"
    //                    },
    //                    {
    //                        internalType: "bytes",
    //                        name: "_signature",
    //                        type: "bytes"
    //                    }
    //                ],
    //                name: "isValidSignature",
    //                outputs: [
    //                    {
    //                        internalType: "bytes4",
    //                        name: "",
    //                        type: "bytes4"
    //                    }
    //                ],
    //                stateMutability: "view",
    //                type: "function"
    //            }
    //        ],
    //        functionName: "isValidSignature",
    //        args: [
    //            hashTypedData({
    //                domain: {
    //                    chainId: 1,
    //                    name: "Test",
    //                    verifyingContract: zeroAddress
    //                },
    //                primaryType: "Test",
    //                types: {
    //                    Test: [
    //                        {
    //                            name: "test",
    //                            type: "string"
    //                        }
    //                    ]
    //                },
    //                message: {
    //                    test: "hello world"
    //                }
    //            }),
    //            signature
    //        ]
    //    })

    //    expect(response).toBe("0x1626ba7e")
    //})

    test("signature should be verifiably valid", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        const message = "hello world"

        const signature = await smartAccountClient.signMessage({
            message
        })

        const isVerified = await publicClient.verifyMessage({
            address: smartAccountClient.account.address,
            message,
            signature
        })

        expect(isVerified).toBe(true)
    })

    test("verifySignature with signTypedData", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        const signature = await smartAccountClient.signTypedData({
            domain: {
                name: "Ether Mail",
                version: "1",
                chainId: 1,
                verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
            },
            types: {
                Person: [
                    { name: "name", type: "string" },
                    { name: "wallet", type: "address" }
                ],
                Mail: [
                    { name: "from", type: "Person" },
                    { name: "to", type: "Person" },
                    { name: "contents", type: "string" }
                ]
            },
            primaryType: "Mail",
            message: {
                from: {
                    name: "Cow",
                    wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
                },
                to: {
                    name: "Bob",
                    wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
                },
                contents: "Hello, Bob!"
            }
        })

        const isVerified = await publicClient.verifyTypedData({
            address: smartAccountClient.account.address,
            domain: {
                name: "Ether Mail",
                version: "1",
                chainId: 1,
                verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
            },
            types: {
                Person: [
                    { name: "name", type: "string" },
                    { name: "wallet", type: "address" }
                ],
                Mail: [
                    { name: "from", type: "Person" },
                    { name: "to", type: "Person" },
                    { name: "contents", type: "string" }
                ]
            },
            primaryType: "Mail",
            message: {
                from: {
                    name: "Cow",
                    wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
                },
                to: {
                    name: "Bob",
                    wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
                },
                contents: "Hello, Bob!"
            },
            signature
        })

        expect(isVerified).toBeTruthy()
    })

    test("verifySignature with signTypedData of not deployed", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        const signature = await smartAccountClient.signTypedData({
            domain: {
                name: "Ether Mail",
                version: "1",
                chainId: 1,
                verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
            },
            types: {
                Person: [
                    { name: "name", type: "string" },
                    { name: "wallet", type: "address" }
                ],
                Mail: [
                    { name: "from", type: "Person" },
                    { name: "to", type: "Person" },
                    { name: "contents", type: "string" }
                ]
            },
            primaryType: "Mail",
            message: {
                from: {
                    name: "Cow",
                    wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
                },
                to: {
                    name: "Bob",
                    wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
                },
                contents: "Hello, Bob!"
            }
        })

        const isVerified = await publicClient.verifyTypedData({
            address: smartAccountClient.account.address,
            domain: {
                name: "Ether Mail",
                version: "1",
                chainId: 1,
                verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
            },
            types: {
                Person: [
                    { name: "name", type: "string" },
                    { name: "wallet", type: "address" }
                ],
                Mail: [
                    { name: "from", type: "Person" },
                    { name: "to", type: "Person" },
                    { name: "contents", type: "string" }
                ]
            },
            primaryType: "Mail",
            message: {
                from: {
                    name: "Cow",
                    wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
                },
                to: {
                    name: "Bob",
                    wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
                },
                contents: "Hello, Bob!"
            },
            signature
        })

        expect(isVerified).toBeTruthy()
    })
})
