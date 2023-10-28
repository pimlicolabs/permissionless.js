import dotenv from "dotenv"
import {
    PimlicoBundlerClient,
    PimlicoPaymasterClient,
    createPimlicoBundlerClient,
    createPimlicoPaymasterClient
} from "permissionless/clients/pimlico"
import { getUserOperationHash } from "permissionless/utils"
import { http } from "viem"
import { buildUserOp } from "./userOp"
import {
    getEntryPoint,
    getEoaWalletClient,
    getPimlicoBundlerClient,
    getPimlicoPaymasterClient,
    getPublicClient,
    getTestingChain
} from "./utils"
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

describe("Pimlico Actions tests", () => {
    let pimlicoBundlerClient: PimlicoBundlerClient
    let pimlicoPaymasterClient: PimlicoPaymasterClient

    beforeEach(async () => {
        pimlicoBundlerClient = getPimlicoBundlerClient()
        pimlicoPaymasterClient = getPimlicoPaymasterClient()
    })

    describe("Pimlico Bundler actions", () => {
        test("fetch gas price", async () => {
            const gasPrice = await pimlicoBundlerClient.getUserOperationGasPrice()

            expect(gasPrice).not.toBeUndefined()
            expect(gasPrice).not.toBeNull()

            expect(gasPrice.slow).not.toBeNull()
            expect(gasPrice.slow).not.toBeUndefined()

            expect(gasPrice.standard).not.toBeNull()
            expect(gasPrice.standard).not.toBeUndefined()

            expect(gasPrice.fast).not.toBeNull()
            expect(gasPrice.fast).not.toBeUndefined()

            expect(typeof gasPrice.slow.maxFeePerGas).toBe("bigint")
            expect(gasPrice.slow.maxFeePerGas).toBeGreaterThan(BigInt(0))

            expect(typeof gasPrice.slow.maxPriorityFeePerGas).toBe("bigint")
            expect(gasPrice.slow.maxPriorityFeePerGas).toBeGreaterThan(BigInt(0))

            expect(typeof gasPrice.standard.maxFeePerGas).toBe("bigint")
            expect(gasPrice.standard.maxFeePerGas).toBeGreaterThan(BigInt(0))

            expect(typeof gasPrice.standard.maxPriorityFeePerGas).toBe("bigint")
            expect(gasPrice.standard.maxPriorityFeePerGas).toBeGreaterThan(BigInt(0))

            expect(typeof gasPrice.fast.maxFeePerGas).toBe("bigint")
            expect(gasPrice.fast.maxFeePerGas).toBeGreaterThan(BigInt(0))

            expect(typeof gasPrice.fast.maxPriorityFeePerGas).toBe("bigint")
            expect(gasPrice.fast.maxPriorityFeePerGas).toBeGreaterThan(BigInt(0))
        })

        test("fetch user operation status", async () => {})
    })

    describe("Pimlico paymaster actions ", () => {
        test("Fetching paymaster and data", async () => {
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

            const sponsorUserOperationPaymasterAndData = await pimlicoPaymasterClient.sponsorUserOperation({
                userOperation: userOperation,
                entryPoint: entryPoint
            })

            expect(sponsorUserOperationPaymasterAndData).not.toBeNull()
            expect(sponsorUserOperationPaymasterAndData).not.toBeUndefined()
            expect(sponsorUserOperationPaymasterAndData).not.toBeUndefined()

            expect(typeof sponsorUserOperationPaymasterAndData.callGasLimit).toBe("bigint")
            expect(sponsorUserOperationPaymasterAndData.callGasLimit).toBeGreaterThan(BigInt(0))

            expect(typeof sponsorUserOperationPaymasterAndData.preVerificationGas).toBe("bigint")
            expect(sponsorUserOperationPaymasterAndData.preVerificationGas).toBeGreaterThan(BigInt(0))

            expect(typeof sponsorUserOperationPaymasterAndData.verificationGasLimit).toBe("bigint")
            expect(sponsorUserOperationPaymasterAndData.verificationGasLimit).toBeGreaterThan(BigInt(0))

            expect(sponsorUserOperationPaymasterAndData.paymasterAndData).not.toBeEmpty()
            expect(sponsorUserOperationPaymasterAndData.paymasterAndData).toStartWith("0x")
        })

        test("Sending user op with paymaster and data", async () => {
            const entryPoint = getEntryPoint()
            const eoaWalletClient = getEoaWalletClient()
            const chain = getTestingChain()

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

            const sponsorUserOperationPaymasterAndData = await pimlicoPaymasterClient.sponsorUserOperation({
                userOperation: userOperation,
                entryPoint: entryPoint
            })

            userOperation.paymasterAndData = sponsorUserOperationPaymasterAndData.paymasterAndData
            userOperation.callGasLimit = sponsorUserOperationPaymasterAndData.callGasLimit
            userOperation.verificationGasLimit = sponsorUserOperationPaymasterAndData.verificationGasLimit
            userOperation.preVerificationGas = sponsorUserOperationPaymasterAndData.preVerificationGas

            const userOperationHash = getUserOperationHash({ userOperation, entryPoint, chainId: chain.id })

            userOperation.signature = await eoaWalletClient.signMessage({
                account: eoaWalletClient.account,
                message: { raw: userOperationHash }
            })

            const userOpHash = await pimlicoBundlerClient.sendUserOperation({
                userOperation: userOperation,
                entryPoint: entryPoint
            })

            expect(userOpHash).toBeString()
            expect(userOpHash).toStartWith("0x")

            const userOperationReceipt = await pimlicoBundlerClient.waitForUserOperationReceipt({
                hash: userOpHash
            })

            expect(userOperationReceipt).not.toBeNull()
            expect(userOperationReceipt?.userOpHash).toBe(userOpHash)
            expect(userOperationReceipt?.receipt.transactionHash).not.toBeEmpty()
            expect(userOperationReceipt?.receipt.transactionHash).not.toBeNull()
            expect(userOperationReceipt?.receipt.transactionHash).not.toBeUndefined()

            const userOperationFromUserOpHash = await pimlicoBundlerClient.getUserOperationByHash({ hash: userOpHash })

            expect(userOperationFromUserOpHash).not.toBeNull()
            expect(userOperationFromUserOpHash?.entryPoint).toBe(entryPoint)
            expect(userOperationFromUserOpHash?.transactionHash).toBe(userOperationReceipt?.receipt.transactionHash)

            // for (const key in userOperationFromUserOpHash?.userOperation) {
            //     expect(userOperationFromUserOpHash?.userOperation[key]).toBe(userOperation[key])
            // }

            const userOperationStatus = await pimlicoBundlerClient.getUserOperationStatus({
                hash: userOpHash
            })

            expect(userOperationStatus).not.toBeNull()
            expect(userOperationStatus).not.toBeUndefined()

            expect(userOperationStatus.status).toBe("included")
            expect(userOperationStatus.transactionHash).toBe(userOperationReceipt?.receipt.transactionHash)
        }, 100000)
    })
})
