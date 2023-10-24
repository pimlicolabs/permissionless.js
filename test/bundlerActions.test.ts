import dotenv from "dotenv"
import { BundlerClient, WaitForUserOperationReceiptTimeoutError, createBundlerClient } from "permissionless"
import { getUserOperationHash } from "permissionless/utils"
import { http, Address, Hex } from "viem"
import { buildUserOp } from "./userOp"
import { getEntryPoint, getEoaWalletClient, getPublicClient, getTestingChain } from "./utils"
import { beforeAll, beforeEach, describe, expect, test } from "bun:test"

dotenv.config()

beforeAll(() => {
    if (!process.env.PIMLICO_API_KEY) throw new Error("PIMLICO_API_KEY environment variable not set")
    if (!process.env.STACKUP_API_KEY) throw new Error("STACKUP_API_KEY environment variable not set")
    if (!process.env.FACTORY_ADDRESS) throw new Error("FACTORY_ADDRESS environment variable not set")
    if (!process.env.TEST_PRIVATE_KEY) throw new Error("TEST_PRIVATE_KEY environment variable not set")
    if (!process.env.RPC_URL) throw new Error("RPC_URL environment variable not set")
    if (!process.env.ENTRYPOINT_ADDRESS) throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
})

const pimlicoApiKey = process.env.PIMLICO_API_KEY

describe("BUNDLER ACTIONS", () => {
    let bundlerClient: BundlerClient

    beforeEach(async () => {
        const chain = getTestingChain()

        bundlerClient = createBundlerClient({
            chain: chain,
            transport: http(`https://api.pimlico.io/v1/${chain.name.toLowerCase()}/rpc?apikey=${pimlicoApiKey}`)
        })
    })

    test("Supported entry points request", async () => {
        const supportedEntryPoints = await bundlerClient.supportedEntryPoints()

        expect(supportedEntryPoints).toBeArray()
        expect(supportedEntryPoints.length).toBeGreaterThan(0)
        expect(supportedEntryPoints.includes(getEntryPoint())).toBe(true)
    })

    test("Chain id call", async () => {
        const chainId = await bundlerClient.chainId()
        const chain = getTestingChain()

        expect(chainId).toBeNumber()
        expect(chainId).toBeGreaterThan(0)
        expect(chainId === chain.id).toBe(true)
    })

    test("Estimate user operation gas", async () => {
        const eoaWalletClient = getEoaWalletClient()
        const publicClient = await getPublicClient()
        const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas()

        const userOperation = {
            ...(await buildUserOp(eoaWalletClient)),
            maxFeePerGas: maxFeePerGas || 0n,
            maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
            callGasLimit: 0n,
            verificationGasLimit: 0n,
            preVerificationGas: 0n
        }

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
        const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas()

        const userOperation = {
            ...(await buildUserOp(eoaWalletClient)),
            maxFeePerGas: maxFeePerGas || 0n,
            maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
            callGasLimit: 0n,
            verificationGasLimit: 0n,
            preVerificationGas: 0n
        }

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
            message: { raw: getUserOperationHash({ userOperation, entryPoint, chainId: chain.id }) }
        })

        const userOpHash = await bundlerClient.sendUserOperation({
            userOperation: userOperation,
            entryPoint: entryPoint as Address
        })

        expect(userOpHash).toBeString()
        expect(userOpHash).toStartWith("0x")

        const userOperationReceipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash })

        expect(userOperationReceipt).not.toBeNull()
        expect(userOperationReceipt?.userOpHash).toBe(userOpHash)
        expect(userOperationReceipt?.receipt.transactionHash).not.toBeEmpty()
        expect(userOperationReceipt?.receipt.transactionHash).not.toBeNull()
        expect(userOperationReceipt?.receipt.transactionHash).not.toBeUndefined()

        const userOperationFromUserOpHash = await bundlerClient.getUserOperationByHash({ hash: userOpHash })

        expect(userOperationFromUserOpHash).not.toBeNull()
        expect(userOperationFromUserOpHash?.entryPoint).toBe(entryPoint)
        expect(userOperationFromUserOpHash?.transactionHash).toBe(userOperationReceipt?.receipt.transactionHash)

        for (const key in userOperationFromUserOpHash?.userOperation) {
            expect(userOperationFromUserOpHash?.userOperation[key]).toBe(userOperation[key])
        }
    }, 100000)

    test("wait for user operation receipt fail", async () => {
        const eoaWalletClient = getEoaWalletClient()
        const publicClient = await getPublicClient()
        const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas()

        const userOperation = {
            ...(await buildUserOp(eoaWalletClient)),
            maxFeePerGas: maxFeePerGas || 0n,
            maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
            callGasLimit: 0n,
            verificationGasLimit: 0n,
            preVerificationGas: 0n
        }

        const entryPoint = getEntryPoint()
        const chain = getTestingChain()

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            userOperation,
            entryPoint: getEntryPoint()
        })

        userOperation.callGasLimit = gasParameters.callGasLimit
        userOperation.verificationGasLimit = gasParameters.verificationGasLimit
        userOperation.preVerificationGas = gasParameters.preVerificationGas

        const userOpHash = getUserOperationHash({ userOperation, entryPoint, chainId: chain.id })

        await expect(async () => {
            await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash, timeout: 100 })
        }).toThrow(new WaitForUserOperationReceiptTimeoutError({ hash: userOpHash }))
    })
})
