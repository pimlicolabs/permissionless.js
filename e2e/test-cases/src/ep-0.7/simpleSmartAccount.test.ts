import {
    SignTransactionNotSupportedBySmartAccount,
    signerToSimpleSmartAccount
} from "permissionless/accounts"
import {
    http,
    type Account,
    type Chain,
    type Transport,
    type WalletClient,
    decodeEventLog,
    getContract,
    zeroAddress,
    isAddress,
    isHash,
    type PublicClient,
    parseEther
} from "viem"
import { foundry } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import {
    type BundlerClient,
    ENTRYPOINT_ADDRESS_V07,
    createSmartAccountClient
} from "permissionless"
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types"
import {
    ensureAltoReady,
    getAnvilWalletClient,
    getBundlerClient,
    setupSimpleSmartAccountClient,
    fund,
    getPublicClient,
    getFactoryAddress,
    getPimlicoPaymasterClient
} from "../utils"
import { ENTRYPOINT_V07_ABI } from "../../abi/entryPointV07Abi"
import { generatePrivateKey } from "viem/accounts"

describe("Simple Smart Account", () => {
    let bundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE, Chain>
    let walletClient: WalletClient<Transport, Chain, Account>
    let publicClient: PublicClient<Transport, Chain>

    beforeAll(async () => {
        walletClient = getAnvilWalletClient()
        publicClient = getPublicClient()
        bundlerClient = getBundlerClient(ENTRYPOINT_ADDRESS_V07)
        await ensureAltoReady(bundlerClient)
    })

    test("signTransaction should throw", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })
        const simpleSmartAccount = smartAccountClient.account

        expect(isAddress(simpleSmartAccount.address)).toBeTruthy()

        await expect(async () =>
            simpleSmartAccount.signTransaction({
                to: zeroAddress,
                value: 0n,
                data: "0x"
            })
        ).rejects.toThrow(SignTransactionNotSupportedBySmartAccount)
    })

    test("signMessage should throw", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        await expect(async () =>
            smartAccountClient.signMessage({
                message: "hello world"
            })
        ).rejects.toThrowError("Simple account isn't 1271 compliant")
    })

    test("signTypedData should throw", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        await expect(async () =>
            smartAccountClient.signTypedData({
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
        ).rejects.toThrowError("Simple account isn't 1271 compliant")
    })

    test("deployContract should throw", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        await expect(async () =>
            smartAccountClient.deployContract({
                abi: ENTRYPOINT_V07_ABI,
                bytecode: "0x88449900"
            })
        ).rejects.toThrowError(
            "Simple account doesn't support account deployment"
        )
    })

    test("can send multiple transactions", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        await fund(smartAccountClient.account.address, walletClient)

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

        expect(isHash(response)).toBeTruthy()
    }, 1000000)

    test("can write contract", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
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

    test("can send transaction", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        await fund(smartAccountClient.account.address, walletClient)

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expect(isHash(response)).toBeTruthy()
    }, 1000000)

    test.only("signerToSimpleSmartAccount should work with existing (deployed) smart account", async () => {
        const privateKey = generatePrivateKey()

        const existingSimpleClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            privateKey
        })

        // force a deployment
        await fund(existingSimpleClient.account.address, walletClient)
        await existingSimpleClient.sendTransaction({
            to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5"
        })

        // create new simpleSmartAccount client from existing SmartAcocunt
        const newSimpleSigner = await signerToSimpleSmartAccount(publicClient, {
            signer: privateKeyToAccount(privateKey),
            address: existingSimpleClient.account.address, // this is the field we are testing
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            factoryAddress: getFactoryAddress(ENTRYPOINT_ADDRESS_V07, "simple")
        })

        const newSimpleClient = createSmartAccountClient({
            chain: foundry,
            account: newSimpleSigner,
            bundlerTransport: http(process.env.ALTO_RPC)
        })

        const response = await newSimpleClient.sendTransaction({
            to: zeroAddress,
            data: "0x",
            value: parseEther("0.01")
        })

        expect(isHash(response))
    }, 1000000)

    test.only("can handle prepareUserOperationRequest", async () => {
        const simpleClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        await fund(simpleClient.account.address, walletClient)

        const userOperation = await simpleClient.prepareUserOperationRequest({
            userOperation: {
                callData: await simpleClient.account.encodeCallData({
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                })
            }
        })

        userOperation.signature =
            await simpleClient.account.signUserOperation(userOperation)

        await bundlerClient.sendUserOperation({ userOperation })
    }, 1000000)

    test("can send Transaction with paymaster", async () => {
        const simpleClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V07)
        })

        const response = await simpleClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expect(isHash(response)).toBeTruthy()

        const transactionReceipt = await publicClient.waitForTransactionReceipt(
            {
                hash: response
            }
        )

        let eventFound = false

        for (const log of transactionReceipt.logs) {
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
                expect(userOperation?.userOperation.paymasterAndData).not.toBe(
                    "0x"
                )
            }
        }

        expect(eventFound).toBeTruthy()
    }, 1000000)

    test("smart account client send multiple Transactions with paymaster", async () => {
        const simpleClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V07)
        })

        const response = await simpleClient.sendTransactions({
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

        expect(isHash(response)).toBeTruthy()

        const transactionReceipt = await publicClient.waitForTransactionReceipt(
            {
                hash: response
            }
        )

        let eventFound = false

        for (const log of transactionReceipt.logs) {
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
                expect(userOperation?.userOperation.paymasterAndData).not.toBe(
                    "0x"
                )
            }
        }

        expect(eventFound).toBeTruthy()
    }, 1000000)
})
