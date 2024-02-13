import dotenv from "dotenv"
import {
    BundlerClient,
    ENTRYPOINT_ADDRESS_0_7,
    UserOperation,
    WaitForUserOperationReceiptTimeoutError,
    createBundlerClient,
    createSmartAccountClient,
    getAccountNonce,
    walletClientToSmartAccountSigner
} from "permissionless"
import { signerToSimpleSmartAccount } from "permissionless/accounts"
import { ENTRYPOINT_ADDRESS_0_7_TYPE } from "permissionless/types"
import { getUserOperationHash } from "permissionless/utils"
import { http, Address, type Hash, parseEther } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
    beforeAll,
    beforeEach,
    describe,
    expect,
    expectTypeOf,
    test
} from "vitest"
import { buildUserOp } from "./userOp"
import {
    getBundlerClient,
    getEntryPoint,
    getEoaWalletClient,
    getPublicClient,
    getSignerToSimpleSmartAccount,
    getTestingChain,
    waitForNonceUpdate
} from "./utils"

dotenv.config()

beforeAll(() => {
    if (!process.env.FACTORY_ADDRESS)
        throw new Error("FACTORY_ADDRESS environment variable not set")
    if (!process.env.TEST_PRIVATE_KEY)
        throw new Error("TEST_PRIVATE_KEY environment variable not set")
    if (!process.env.RPC_URL)
        throw new Error("RPC_URL environment variable not set")
    if (!process.env.ENTRYPOINT_ADDRESS)
        throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
})

describe("BUNDLER ACTIONS", () => {
    let bundlerClient: BundlerClient

    beforeEach(async () => {
        bundlerClient = getBundlerClient()
    })

    test.skip("Supported entry points request", async () => {
        const supportedEntryPoints = await bundlerClient.supportedEntryPoints()

        expectTypeOf(supportedEntryPoints).toBeArray()
        expect(supportedEntryPoints.length).toBeGreaterThan(0)
        expect(supportedEntryPoints.includes(getEntryPoint())).toBe(true)
    })

    test.skip("Chain id call", async () => {
        const chainId = await bundlerClient.chainId()
        const chain = getTestingChain()

        expectTypeOf(chainId).toBeNumber()
        expect(chainId).toBeGreaterThan(0)
        expect(chainId === chain.id).toBe(true)
    })

    test.skip("Estimate user operation gas", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const userOperation = await buildUserOp(eoaWalletClient)

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            userOperation,
            entryPoint: getEntryPoint()
        })

        expect(gasParameters.callGasLimit).toBeGreaterThan(BigInt(0))
        expect(gasParameters.verificationGasLimit).toBeGreaterThan(BigInt(0))
        expect(gasParameters.preVerificationGas).toBeGreaterThan(BigInt(0))
    })

    test("Sending user operation", async () => {
        const publicClient = await getPublicClient()
        const eoaWalletClient = getEoaWalletClient()

        const bundlerClient = createBundlerClient({
            chain: getTestingChain(),
            transport: http(`${process.env.BUNDLER_RPC_HOST}`),
            entryPoint: ENTRYPOINT_ADDRESS_0_7
        })

        const simpleAccount = await signerToSimpleSmartAccount(publicClient, {
            signer: walletClientToSmartAccountSigner(eoaWalletClient),
            entryPoint: ENTRYPOINT_ADDRESS_0_7,
            factoryAddress: process.env.FACTORY_ADDRESS as Address
        })

        const smartAccountClient = createSmartAccountClient({
            account: simpleAccount,
            chain: getTestingChain(),
            transport: http(`${process.env.BUNDLER_RPC_HOST}`),
            sponsorUserOperation: async (args) => {
                return args.userOperation
            },
            entryPoint: ENTRYPOINT_ADDRESS_0_7
        })

        const userOperation =
            await smartAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: "0x"
                }
            })

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
            ENTRYPOINT_ADDRESS_0_7
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

    test.skip("wait for user operation receipt fail", async () => {
        const eoaWalletClient = getEoaWalletClient()
        const userOperation = await buildUserOp(eoaWalletClient)

        const entryPoint = getEntryPoint()
        const chain = getTestingChain()

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            userOperation,
            entryPoint: getEntryPoint()
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
