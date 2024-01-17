import dotenv from "dotenv"
import { UserOperation } from "permissionless"
import {
    SignTransactionNotSupportedBySmartAccount,
    signerToEcdsaKernelSmartAccount
} from "permissionless/accounts"
import { Address, Hex, decodeEventLog, getContract, zeroAddress } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeAll, describe, expect, expectTypeOf, test } from "vitest"
import { EntryPointAbi } from "./abis/EntryPoint.js"
import { GreeterAbi, GreeterBytecode } from "./abis/Greeter.js"
import {
    getBundlerClient,
    getEntryPoint,
    getPimlicoPaymasterClient,
    getPublicClient,
    getSignerToEcdsaKernelAccount,
    getSmartAccountClient,
    waitForNonceUpdate
} from "./utils.js"

dotenv.config()

let testPrivateKey: Hex
let factoryAddress: Address
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
    if (!process.env.ENTRYPOINT_ADDRESS) {
        throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
    }

    testPrivateKey = process.env.TEST_PRIVATE_KEY as Hex
    factoryAddress = process.env.FACTORY_ADDRESS as Address
})

/**
 * TODO: Should generify the basics test for every smart account & smart account client (address, signature, etc)
 */
describe("ECDSA kernel Account", () => {
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

    test("Client signMessage", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToEcdsaKernelAccount()
        })

        const response = await smartAccountClient.signMessage({
            message: "hello world"
        })

        expectTypeOf(response).toBeString()
        expect(response).toHaveLength(132)
        expect(response).toMatch(/^0x[0-9a-fA-F]{130}$/)
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
        expect(response).toHaveLength(132)
        expect(response).toMatch(/^0x[0-9a-fA-F]{130}$/)
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

    test("Smart account client send multiple transactions", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToEcdsaKernelAccount()
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
        await waitForNonceUpdate()
    }, 1000000)

    test("Write contract", async () => {
        const smartAccountClient = await getSmartAccountClient({
            account: await getSignerToEcdsaKernelAccount()
        })

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

    test("Client send Transaction with paymaster", async () => {
        const account = await getSignerToEcdsaKernelAccount()

        const publicClient = await getPublicClient()

        const bundlerClient = getBundlerClient()

        const smartAccountClient = await getSmartAccountClient({
            account,
            sponsorUserOperation: async ({
                entryPoint: _entryPoint,
                userOperation
            }): Promise<UserOperation> => {
                const pimlicoPaymaster = getPimlicoPaymasterClient()
                return pimlicoPaymaster.sponsorUserOperation({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
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

        const publicClient = await getPublicClient()

        const bundlerClient = getBundlerClient()

        const smartAccountClient = await getSmartAccountClient({
            account,
            sponsorUserOperation: async ({
                entryPoint: _entryPoint,
                userOperation
            }): Promise<UserOperation> => {
                const pimlicoPaymaster = getPimlicoPaymasterClient()
                return pimlicoPaymaster.sponsorUserOperation({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
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
        const publicClient = await getPublicClient()
        const smartAccountClient = await getSmartAccountClient({
            account: initialEcdsaSmartAccount,
            sponsorUserOperation: async ({
                entryPoint: _entryPoint,
                userOperation
            }): Promise<UserOperation> => {
                const pimlicoPaymaster = getPimlicoPaymasterClient()
                return pimlicoPaymaster.sponsorUserOperation({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
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
})
