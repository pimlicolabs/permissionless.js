import dotenv from "dotenv"
import {
    BundlerClient,
    ENTRYPOINT_ADDRESS_V07,
    UserOperation,
    WaitForUserOperationReceiptTimeoutError,
    createBundlerClient,
    createSmartAccountClient,
    getAccountNonce,
    walletClientToSmartAccountSigner
} from "permissionless"
import { signerToSimpleSmartAccount } from "permissionless/accounts"
import { ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types"
import { getUserOperationHash } from "permissionless/utils"
import {
    http,
    Account,
    Address,
    Chain,
    type Hash,
    Transport,
    WalletClient,
    createWalletClient,
    parseEther,
    zeroAddress
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
    beforeAll,
    beforeEach,
    describe,
    expect,
    expectTypeOf,
    test
} from "vitest"
import {
    getBundlerClient,
    getEntryPoint,
    getEoaWalletClient,
    getPimlicoBundlerClient,
    getPimlicoPaymasterClient,
    getPrivateKeyAccount,
    getPublicClient,
    getSignerToSimpleSmartAccount,
    getSmartAccountClient,
    getTestingChain,
    refillSmartAccount,
    waitForNonceUpdate
} from "./utils"

dotenv.config()

beforeAll(() => {
    if (!process.env.FACTORY_ADDRESS_V07)
        throw new Error("FACTORY_ADDRESS_V07 environment variable not set")
    if (!process.env.TEST_PRIVATE_KEY)
        throw new Error("TEST_PRIVATE_KEY environment variable not set")
    if (!process.env.RPC_URL)
        throw new Error("RPC_URL environment variable not set")
})

describe("BUNDLER ACTIONS", () => {
    let bundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>
    let walletClient: WalletClient<Transport, Chain, Account>

    beforeEach(async () => {
        const owner = getPrivateKeyAccount()
        walletClient = createWalletClient({
            account: owner,
            chain: getTestingChain(),
            transport: http(process.env.RPC_URL as string)
        })
        bundlerClient = getBundlerClient()
    })

    test("Supported entry points request", async () => {
        const supportedEntryPoints = await bundlerClient.supportedEntryPoints()

        expectTypeOf(supportedEntryPoints).toBeArray()
        expect(supportedEntryPoints.length).toBeGreaterThan(0)
        expect(supportedEntryPoints.includes(getEntryPoint())).toBe(true)
    })

    test("Chain id call", async () => {
        const chainId = await bundlerClient.chainId()
        const chain = getTestingChain()

        expectTypeOf(chainId).toBeNumber()
        expect(chainId).toBeGreaterThan(0)
        expect(chainId === chain.id).toBe(true)
    })

    test("Estimate user operation gas", async () => {
        const publicClient = getPublicClient()

        const simpleAccount = await signerToSimpleSmartAccount(publicClient, {
            signer: privateKeyToAccount(
                process.env.TEST_PRIVATE_KEY as Address
            ),
            entryPoint: getEntryPoint(),
            factoryAddress: process.env.FACTORY_ADDRESS_V07 as Address,
            index: BigInt(3)
        })

        const paymasterClient = getPimlicoPaymasterClient()
        const pimlicoBundlerClient = getPimlicoBundlerClient()

        const smartAccountClient = createSmartAccountClient({
            account: simpleAccount,
            chain: getTestingChain(),
            bundlerTransport: http(`${process.env.BUNDLER_RPC_HOST}`),
            middleware: {
                gasPrice: async () => {
                    const gasPrices =
                        await pimlicoBundlerClient.getUserOperationGasPrice()
                    return gasPrices.fast
                },
                sponsorUserOperation: paymasterClient.sponsorUserOperation
            }
        })

        // await eoaWalletClient.sendTransaction({
        //     to: simpleAccount.address,
        //     value: parseEther("1")
        // })

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: BigInt(0)
        })
    }, 100000)

    test("Sending user operation", async () => {
        const publicClient = getPublicClient()
        const eoaWalletClient = getEoaWalletClient()

        const bundlerClient = createBundlerClient({
            chain: getTestingChain(),
            transport: http(`${process.env.BUNDLER_RPC_HOST}`),
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        const simpleAccount = await signerToSimpleSmartAccount(publicClient, {
            signer: walletClientToSmartAccountSigner(eoaWalletClient),
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            factoryAddress: process.env.FACTORY_ADDRESS_V07 as Address
        })

        const smartAccountClient = createSmartAccountClient({
            account: simpleAccount,
            chain: getTestingChain(),
            bundlerTransport: http(`${process.env.BUNDLER_RPC_HOST}`),
            middleware: async (args) => {
                return args.userOperation
            }
        })

        await refillSmartAccount(
            walletClient,
            smartAccountClient.account.address
        )

        const userOperation =
            await smartAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: "0x"
                }
            })

        userOperation.signature =
            await smartAccountClient.account.signUserOperation(userOperation)

        const userOpHash = await bundlerClient.sendUserOperation({
            userOperation: userOperation
        })

        expectTypeOf(userOpHash).toBeString()
        expectTypeOf(userOpHash).toMatchTypeOf<Hash>()

        const userOperationReceipt =
            await bundlerClient.waitForUserOperationReceipt({
                hash: userOpHash
            })
        expect(userOperationReceipt).not.toBeNull()
        expect(userOperationReceipt?.userOpHash).toBe(userOpHash)
        expect(userOperationReceipt?.receipt.transactionHash).not.toBeNull()
        expect(
            userOperationReceipt?.receipt.transactionHash
        ).not.toBeUndefined()

        const receipt = await bundlerClient.getUserOperationReceipt({
            hash: userOpHash
        })

        expect(receipt?.receipt.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )

        const userOperationFromUserOpHash =
            await bundlerClient.getUserOperationByHash({ hash: userOpHash })

        expect(userOperationFromUserOpHash).not.toBeNull()
        expect(userOperationFromUserOpHash?.entryPoint).toBe(
            ENTRYPOINT_ADDRESS_V07
        )
        expect(userOperationFromUserOpHash?.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )

        for (const key in userOperationFromUserOpHash?.userOperation) {
            expect(userOperationFromUserOpHash?.userOperation[key]).toBe(
                userOperation[key]
            )
        }
        await waitForNonceUpdate()

        const newNonce = getAccountNonce(publicClient, {
            sender: userOperation.sender,
            entryPoint: getEntryPoint()
        })

        // expect(newNonce).toBe(userOperation.nonce + BigInt(1))
    }, 100000)

    test("wait for user operation receipt fail", async () => {
        const simpleAccountClient = await getSmartAccountClient()

        const userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        value: BigInt(0),
                        data: "0x"
                    })
                }
            })

        const entryPoint = getEntryPoint()
        const chain = getTestingChain()

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            userOperation
        })

        userOperation.callGasLimit = gasParameters.callGasLimit
        userOperation.verificationGasLimit = gasParameters.verificationGasLimit
        userOperation.preVerificationGas = gasParameters.preVerificationGas

        const userOpHash = getUserOperationHash({
            userOperation,
            entryPoint,
            chainId: chain.id
        })

        await expect(async () =>
            bundlerClient.waitForUserOperationReceipt({
                hash: userOpHash,
                timeout: 100
            })
        ).rejects.toThrow(WaitForUserOperationReceiptTimeoutError)
    })
})
