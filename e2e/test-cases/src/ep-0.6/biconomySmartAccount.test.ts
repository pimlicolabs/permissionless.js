import {
    SignTransactionNotSupportedBySmartAccount,
    signerToBiconomySmartAccount
} from "permissionless/accounts"
import {
    type Account,
    type Chain,
    type Transport,
    type WalletClient,
    decodeEventLog,
    getContract,
    zeroAddress,
    type PublicClient,
    isAddress,
    isHash,
    parseEther,
    type BaseError
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import {
    getBundlerClient,
    getPimlicoPaymasterClient,
    getAnvilWalletClient,
    getPublicClient,
    setupEcdsaBiconomySmartAccountClient,
    fund
} from "../utils"
import { ENTRYPOINT_ADDRESS_V06, type BundlerClient } from "permissionless"
import { ENTRYPOINT_V06_ABI } from "../../abi/entryPointV06Abi"
import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types"

/**
 * TODO: Should generify the basics test for every smart account & smart account client (address, signature, etc)
 */
describe("Biconomy Modular Smart Account (ECDSA module)", () => {
    let walletClient: WalletClient<Transport, Chain, Account>
    let publicClient: PublicClient<Transport, Chain>
    let bundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE, Chain>

    beforeEach(async () => {
        walletClient = getAnvilWalletClient(95)
        publicClient = getPublicClient()
        bundlerClient = getBundlerClient(ENTRYPOINT_ADDRESS_V06)
    })

    test("Account address", async () => {
        const ecdsaSmartClient = await setupEcdsaBiconomySmartAccountClient({})
        const ecdsaSmartAccount = ecdsaSmartClient.account

        expect(isAddress(ecdsaSmartAccount.address)).toBe(true)

        await expect(async () =>
            ecdsaSmartAccount.signTransaction({
                to: zeroAddress,
                value: 0n,
                data: "0x"
            })
        ).rejects.toThrow(SignTransactionNotSupportedBySmartAccount)
    })

    test("Client deploy contract", async () => {
        const ecdsaSmartClient = await setupEcdsaBiconomySmartAccountClient({})

        await expect(async () =>
            ecdsaSmartClient.deployContract({
                abi: [],
                bytecode: "0xff66"
            })
        ).rejects.toThrowError("Doesn't support account deployment")
    })

    test("Smart account client send multiple transactions", async () => {
        const ecdsaSmartClient = await setupEcdsaBiconomySmartAccountClient({})

        await fund(ecdsaSmartClient.account.address, walletClient)

        const response = await ecdsaSmartClient.sendTransactions({
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
    }, 10000)

    test("Write contract", async () => {
        const ecdsaSmartClient = await setupEcdsaBiconomySmartAccountClient({})

        await fund(ecdsaSmartClient.account.address, walletClient)

        const entryPointContract = getContract({
            abi: ENTRYPOINT_V06_ABI,
            address: ENTRYPOINT_ADDRESS_V06,
            client: {
                public: getPublicClient(),
                wallet: ecdsaSmartClient
            }
        })

        const oldBalance = await entryPointContract.read.balanceOf([
            ecdsaSmartClient.account.address
        ])

        const txHash = await entryPointContract.write.depositTo(
            [ecdsaSmartClient.account.address],
            {
                value: parseEther("0.25")
            }
        )

        expect(isHash(txHash)).toBe(true)

        const newBalance = await entryPointContract.read.balanceOf([
            ecdsaSmartClient.account.address
        ])

        //@ts-ignore
        expect(newBalance - oldBalance).toBeGreaterThanOrEqual(
            parseEther("0.25")
        )
    }, 10000)

    test("Client send Transaction with paymaster", async () => {
        const ecdsaSmartClient = await setupEcdsaBiconomySmartAccountClient({
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06)
        })

        const response = await ecdsaSmartClient.sendTransaction({
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
                let event: any
                try {
                    event = decodeEventLog({
                        abi: ENTRYPOINT_V06_ABI,
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
    }, 10000)

    test("Client send multiple Transactions with paymaster", async () => {
        const ecdsaSmartClient = await setupEcdsaBiconomySmartAccountClient({
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06)
        })

        const response = await ecdsaSmartClient.sendTransactions({
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
                let event: any
                try {
                    event = decodeEventLog({
                        abi: ENTRYPOINT_V06_ABI,
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
    }, 10000)

    test("Can use a deployed account", async () => {
        const privateKey = generatePrivateKey()

        const initialSmartClient = await setupEcdsaBiconomySmartAccountClient({
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06),
            privateKey
        })

        // Send an initial tx to deploy the account
        const hash = await initialSmartClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        // Wait for the tx to be done (so we are sure that the account is deployed)
        await publicClient.waitForTransactionReceipt({ hash })

        // Build a new account with a valid owner
        const signer = privateKeyToAccount(privateKey)
        const alreadyDeployedEcdsaSmartAccount =
            await signerToBiconomySmartAccount(publicClient, {
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                signer: signer
            })

        // Ensure the two account have the same address
        expect(alreadyDeployedEcdsaSmartAccount.address).toMatch(
            initialSmartClient.account.address
        )
    }, 10000)

    test("verifySignature of deployed", async () => {
        const smartClient = await setupEcdsaBiconomySmartAccountClient({
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06)
        })
        const smartAccount = smartClient.account

        const message = "hello world"

        const signature = await smartAccount.signMessage({
            message
        })

        const publicClient = getPublicClient()

        const isVerified = await publicClient.verifyMessage({
            address: smartAccount.address,
            message,
            signature
        })

        expect(isVerified).toBeTruthy()
    })

    test("verifySignature of not deployed", async () => {
        const smartClient = await setupEcdsaBiconomySmartAccountClient({
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06)
        })

        const message = "hello world"

        const signature = await smartClient.signMessage({
            message
        })

        const publicClient = getPublicClient()

        const isVerified = await publicClient.verifyMessage({
            address: smartClient.account.address,
            message,
            signature
        })

        expect(isVerified).toBeTruthy()
    })

    test("verifySignature with signTypedData", async () => {
        const smartClient = await setupEcdsaBiconomySmartAccountClient({
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06)
        })

        const signature = await smartClient.signTypedData({
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
            address: smartClient.account.address,
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
        const smartClient = await setupEcdsaBiconomySmartAccountClient({
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06)
        })

        const signature = await smartClient.signTypedData({
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
            address: smartClient.account.address,
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
