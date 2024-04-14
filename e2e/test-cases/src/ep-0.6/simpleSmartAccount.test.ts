import {
    type BundlerClient,
    ENTRYPOINT_ADDRESS_V06,
    createSmartAccountClient
} from "permissionless"
import {
    SignTransactionNotSupportedBySmartAccount,
    signerToSimpleSmartAccount
} from "permissionless/accounts"
import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types"
import {
    http,
    type Account,
    type Chain,
    type PublicClient,
    type Transport,
    type WalletClient,
    decodeEventLog,
    getContract,
    isAddress,
    isHash,
    parseEther,
    zeroAddress
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { generatePrivateKey } from "viem/accounts"
import { foundry } from "viem/chains"
import { ENTRYPOINT_V06_ABI } from "../../abi/entryPointV06Abi"
import {
    fund,
    getAnvilWalletClient,
    getBundlerClient,
    getFactoryAddress,
    getPimlicoPaymasterClient,
    getPublicClient,
    setupSimpleSmartAccountClient
} from "../utils"

describe("Simple Smart Account", () => {
    let bundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE, Chain>
    let walletClient: WalletClient<Transport, Chain, Account>
    let publicClient: PublicClient<Transport, Chain>

    beforeAll(async () => {
        walletClient = getAnvilWalletClient(91)
        publicClient = getPublicClient()
        bundlerClient = getBundlerClient(ENTRYPOINT_ADDRESS_V06)
    })

    test("signTransaction should throw", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06
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
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        await expect(async () =>
            smartAccountClient.signMessage({
                message: "hello world"
            })
        ).rejects.toThrowError("Simple account isn't 1271 compliant")
    })

    test("signTypedData should throw", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06
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
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        await expect(async () =>
            smartAccountClient.deployContract({
                abi: ENTRYPOINT_V06_ABI,
                bytecode: "0x88449900"
            })
        ).rejects.toThrowError(
            "Simple account doesn't support account deployment"
        )
    })

    test("can send multiple transactions", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06
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
    }, 10000)

    test("can write contract", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        await fund(smartAccountClient.account.address, walletClient)

        const entryPointContract = getContract({
            abi: ENTRYPOINT_V06_ABI,
            address: ENTRYPOINT_ADDRESS_V06,
            client: {
                public: publicClient,
                wallet: smartAccountClient
            }
        })

        const txHash = await entryPointContract.write.depositTo(
            [smartAccountClient.account.address],
            {
                value: parseEther("0.25")
            }
        )

        expect(isHash(txHash)).toBeTruthy()

        const status = await publicClient.waitForTransactionReceipt({
            hash: txHash
        })

        expect(status.status === "success").toBe(true)
    }, 10000)

    test("can send transaction", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        await fund(smartAccountClient.account.address, walletClient)

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expect(isHash(response)).toBeTruthy()
    }, 10000)

    test("signerToSimpleSmartAccount should work with existing (deployed) smart account", async () => {
        const privateKey = generatePrivateKey()

        const existingSimpleClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            privateKey
        })

        // force a deployment
        await fund(existingSimpleClient.account.address, walletClient)
        await existingSimpleClient.sendTransaction({
            to: zeroAddress
        })

        // create new simpleSmartAccount client from existing SmartAcocunt
        const newSimpleSigner = await signerToSimpleSmartAccount(publicClient, {
            signer: privateKeyToAccount(privateKey),
            address: existingSimpleClient.account.address, // this is the field we are testing
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            factoryAddress: getFactoryAddress(ENTRYPOINT_ADDRESS_V06, "simple")
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
    }, 25000)

    test("can handle prepareUserOperationRequest", async () => {
        const simpleClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06
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
    }, 10000)

    test("can send transaction with paymaster", async () => {
        const simpleClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06)
        })

        const response = await simpleClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x6699"
        })

        expect(isHash(response)).toBeTruthy()

        const transactionReceipt = await publicClient.waitForTransactionReceipt(
            {
                hash: response
            }
        )

        let eventFound = false

        for (const log of transactionReceipt.logs) {
            // biome-ignore lint/suspicious/noExplicitAny:
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
                //const userOperation =
                //    await bundlerClient.getUserOperationByHash({
                //        hash: event.args.userOpHash
                //    })
                //expect(userOperation?.userOperation.paymasterAndData).not.toBe(
                //    "0x"
                //)
            }
        }

        expect(eventFound).toBeTruthy()
    }, 10000)

    test("smart account client send multiple Transactions with paymaster", async () => {
        const simpleClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            paymasterClient: getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06)
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
            // biome-ignore lint/suspicious/noExplicitAny:
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
                expect(userOperation?.userOperation.paymasterAndData).not.toBe(
                    "0x"
                )
            }
        }

        expect(eventFound).toBeTruthy()
    }, 10000)
})
