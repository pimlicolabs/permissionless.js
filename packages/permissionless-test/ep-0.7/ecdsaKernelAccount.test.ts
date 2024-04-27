import dotenv from "dotenv"
import {
    SignTransactionNotSupportedBySmartAccount,
    signerToEcdsaKernelSmartAccount
} from "permissionless/accounts"
import {
    http,
    type Account,
    type Chain,
    type Hex,
    type Transport,
    type WalletClient,
    createWalletClient,
    decodeEventLog,
    getContract,
    hashMessage,
    zeroAddress
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
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
    getBundlerClient,
    getEntryPoint,
    getPimlicoPaymasterClient,
    getPrivateKeyAccount,
    getPublicClient,
    getSignerToEcdsaKernelAccount,
    getSmartAccountClient,
    getTestingChain,
    refillSmartAccount,
    waitForNonceUpdate
} from "./utils"

dotenv.config()

beforeAll(() => {
    if (!process.env.FACTORY_ADDRESS_V06) {
        throw new Error("FACTORY_ADDRESS_V06 environment variable not set")
    }
    if (!process.env.TEST_PRIVATE_KEY) {
        throw new Error("TEST_PRIVATE_KEY environment variable not set")
    }
    if (!process.env.RPC_URL) {
        throw new Error("RPC_URL environment variable not set")
    }
})

/**
 * TODO: Should generify the basics test for every smart account & smart account client (address, signature, etc)
 */
describe("ECDSA kernel Account", () => {
    let walletClient: WalletClient<Transport, Chain, Account>

    beforeEach(async () => {
        const owner = getPrivateKeyAccount()
        walletClient = createWalletClient({
            account: owner,
            chain: getTestingChain(),
            transport: http(process.env.RPC_URL as string)
        })
    })

    test("Account address", async () => {
        const ecdsaSmartAccount = await getSignerToEcdsaKernelAccount()

        expectTypeOf(ecdsaSmartAccount.address).toBeString()
        expect(ecdsaSmartAccount.address).toHaveLength(42)
        expect(ecdsaSmartAccount.address).toMatch(/^0x[0-9a-fA-F]{40}$/)

        await expect(async () =>
            ecdsaSmartAccount.signTransaction({
                to: zeroAddress,
                value: 0n,
                data: "0x"
            })
        ).rejects.toThrow(SignTransactionNotSupportedBySmartAccount)
    })

    test("Client deploy contract", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToEcdsaKernelAccount()
        })

        await expect(async () =>
            smartAccountClient.deployContract({
                abi: GreeterAbi,
                bytecode: GreeterBytecode
            })
        ).rejects.toThrowError(
            "Simple account doesn't support account deployment"
        )
    })

    test("Smart account client send transaction", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToEcdsaKernelAccount({ index: 69n })
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
        await waitForNonceUpdate()
    }, 1000000)

    test("Smart account client send multiple transactions", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToEcdsaKernelAccount()
        })

        await refillSmartAccount(
            walletClient,
            smartAccountClient.account.address
        )

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
        await waitForNonceUpdate()
    }, 1000000)

    test("Write contract", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToEcdsaKernelAccount()
        })
        await refillSmartAccount(
            walletClient,
            smartAccountClient.account.address
        )

        const entryPointContract = getContract({
            abi: EntryPointAbi,
            address: getEntryPoint(),
            client: {
                public: getPublicClient(),
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

    test("Client send Transaction with paymaster", async () => {
        const account = await getSignerToEcdsaKernelAccount()

        const publicClient = getPublicClient()

        const bundlerClient = getBundlerClient()
        const pimlicoPaymaster = getPimlicoPaymasterClient()

        const smartAccountClient = await getSmartAccountClient({
            account,
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

        for (const log of transactionReceipt.logs) {
            // Encapsulated inside a try catch since if a log isn't wanted from this abi it will throw an error
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
            } catch {}
        }

        expect(eventFound).toBeTruthy()
        await waitForNonceUpdate()
    }, 1000000)

    test("Client send multiple Transactions with paymaster", async () => {
        const account = await getSignerToEcdsaKernelAccount()

        const publicClient = getPublicClient()

        const bundlerClient = getBundlerClient()
        const pimlicoPaymaster = getPimlicoPaymasterClient()

        const smartAccountClient = await getSmartAccountClient({
            account,
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
            // Encapsulated inside a try catch since if a log isn't wanted from this abi it will throw an error
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
            } catch {}
        }

        expect(eventFound).toBeTruthy()
        await waitForNonceUpdate()
    }, 1000000)

    test("Can use a deployed account", async () => {
        const initialEcdsaSmartAccount = await getSignerToEcdsaKernelAccount()
        const publicClient = getPublicClient()
        const pimlicoPaymaster = getPimlicoPaymasterClient()
        const smartAccountClient = await getSmartAccountClient({
            account: initialEcdsaSmartAccount,
            middleware: {
                sponsorUserOperation: pimlicoPaymaster.sponsorUserOperation
            }
        })

        // Send an initial tx to deploy the account
        const hash = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        // Wait for the tx to be done (so we are sure that the account is deployed)
        await publicClient.waitForTransactionReceipt({ hash })
        const deployedAccountAddress = initialEcdsaSmartAccount.address

        // Build a new account with a valid owner
        const signer = privateKeyToAccount(process.env.TEST_PRIVATE_KEY as Hex)
        const alreadyDeployedEcdsaSmartAccount =
            await signerToEcdsaKernelSmartAccount(publicClient, {
                entryPoint: getEntryPoint(),
                signer: signer,
                deployedAccountAddress
            })

        // Ensure the two account have the same address
        expect(alreadyDeployedEcdsaSmartAccount.address).toMatch(
            initialEcdsaSmartAccount.address
        )

        // Ensure that it will fail with an invalid owner address
        const invalidOwner = privateKeyToAccount(generatePrivateKey())
        await expect(async () =>
            signerToEcdsaKernelSmartAccount(publicClient, {
                entryPoint: getEntryPoint(),
                signer: invalidOwner,
                deployedAccountAddress
            })
        ).rejects.toThrowError("Invalid owner for the already deployed account")
    }, 1000000)

    test("Client signMessage", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToEcdsaKernelAccount()
        })

        const response = await smartAccountClient.signMessage({
            message: "hello world"
        })

        expectTypeOf(response).toBeString()
        expect(response).toHaveLength(174)
        expect(response).toMatch(/^0x[0-9a-fA-F]{172}$/)
    })

    test("Smart account client signTypedData", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToEcdsaKernelAccount()
        })

        const response = await smartAccountClient.signTypedData({
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

        expectTypeOf(response).toBeString()
        expect(response).toHaveLength(174)
        expect(response).toMatch(/^0x[0-9a-fA-F]{172}$/)
    })

    test("verifySignature of deployed", async () => {
        const initialEcdsaSmartAccount = await getSignerToEcdsaKernelAccount({
            index: 100n
        })

        const smartAccountClient = await getSmartAccountClient({
            account: initialEcdsaSmartAccount
        })
        const message = "hello world"

        const signature = await smartAccountClient.signMessage({
            message
        })
        console.log({ signature })
        console.log({ address: smartAccountClient.account.address })

        const publicClient = getPublicClient()

        const isVerified = await publicClient.verifyMessage({
            address: smartAccountClient.account.address,
            message,
            signature
        })
        console.log({ isVerified })

        const eip1271response = await publicClient.readContract({
            address: smartAccountClient.account.address,
            abi: [
                {
                    type: "function",
                    name: "isValidSignature",
                    inputs: [
                        {
                            name: "data",
                            type: "bytes32",
                            internalType: "bytes32"
                        },
                        {
                            name: "signature",
                            type: "bytes",
                            internalType: "bytes"
                        }
                    ],
                    outputs: [
                        {
                            name: "magicValue",
                            type: "bytes4",
                            internalType: "bytes4"
                        }
                    ],
                    stateMutability: "view"
                }
            ],
            functionName: "isValidSignature",
            args: [hashMessage(message), signature]
        })
        console.log({ eip1271response })

        expect(isVerified).toBeTruthy()
    })

    test("verifySignature of not deployed", async () => {
        const initialEcdsaSmartAccount = await getSignerToEcdsaKernelAccount({
            index: 1000000000n
        })

        const smartAccountClient = await getSmartAccountClient({
            account: initialEcdsaSmartAccount
        })
        const message = "hello world"

        const signature = await smartAccountClient.signMessage({
            message
        })

        const publicClient = getPublicClient()

        const isVerified = await publicClient.verifyMessage({
            address: smartAccountClient.account.address,
            message,
            signature
        })

        expect(isVerified).toBeTruthy()
    })

    test("verifySignature with signTypedData", async () => {
        const initialEcdsaSmartAccount = await getSignerToEcdsaKernelAccount({
            index: 100n
        })

        const smartAccountClient = await getSmartAccountClient({
            account: initialEcdsaSmartAccount
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

        const publicClient = getPublicClient()

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

    test("verifySignature with signTypedData for not deployed", async () => {
        const initialEcdsaSmartAccount = await getSignerToEcdsaKernelAccount({
            index: 100000000n
        })

        const smartAccountClient = await getSmartAccountClient({
            account: initialEcdsaSmartAccount
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

        const publicClient = getPublicClient()

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
