import dotenv from "dotenv"
import {
    BundlerClient,
    WaitForUserOperationReceiptTimeoutError,
    getAccountNonce
} from "permissionless"
import { getUserOperationHash } from "permissionless/utils"
import { Address, type Hash } from "viem"
import {
    beforeAll,
    beforeEach,
    describe,
    expect,
    expectTypeOf,
    test
} from "vitest"
import { buildUserOp } from "./userOp.js"
import {
    getBundlerClient,
    getEntryPoint,
    getEoaWalletClient,
    getPublicClient,
    getTestingChain,
    waitForNonceUpdate
} from "./utils.js"

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
        const eoaWalletClient = getEoaWalletClient()
        const publicClient = await getPublicClient()
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

        userOperation.signature = await eoaWalletClient.signMessage({
            account: eoaWalletClient.account,
            message: {
                raw: getUserOperationHash({
                    userOperation,
                    entryPoint,
                    chainId: chain.id
                })
            }
        })

        const userOpHash = await bundlerClient.sendUserOperation({
            userOperation: userOperation,
            entryPoint: entryPoint as Address
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
        expect(userOperationFromUserOpHash?.entryPoint).toBe(entryPoint)
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
