import { beforeAll, beforeEach, describe, expect, test } from "bun:test"
import dotenv from "dotenv"
import {
    PimlicoBundlerClient,
    PimlicoPaymasterClient
} from "permissionless/clients/pimlico"
import { UserOperation } from "permissionless/index.js"
import { getUserOperationHash } from "permissionless/utils"
import { buildUserOp } from "./userOp.js"
import {
    getEntryPoint,
    getEoaWalletClient,
    getPimlicoBundlerClient,
    getPimlicoPaymasterClient,
    getPublicClient,
    getTestingChain,
    waitForNonceUpdate
} from "./utils.js"

dotenv.config()

beforeAll(() => {
    if (!process.env.STACKUP_API_KEY)
        throw new Error("STACKUP_API_KEY environment variable not set")
    if (!process.env.FACTORY_ADDRESS)
        throw new Error("FACTORY_ADDRESS environment variable not set")
    if (!process.env.TEST_PRIVATE_KEY)
        throw new Error("TEST_PRIVATE_KEY environment variable not set")
    if (!process.env.RPC_URL)
        throw new Error("RPC_URL environment variable not set")
    if (!process.env.ENTRYPOINT_ADDRESS)
        throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
})

describe("Pimlico Actions tests", () => {
    let pimlicoBundlerClient: PimlicoBundlerClient
    let pimlicoPaymasterClient: PimlicoPaymasterClient

    beforeEach(async () => {
        pimlicoBundlerClient = getPimlicoBundlerClient()
        pimlicoPaymasterClient = getPimlicoPaymasterClient()
    })

    describe("Pimlico Bundler actions", () => {
        test("fetch gas price", async () => {
            const gasPrice =
                await pimlicoBundlerClient.getUserOperationGasPrice()

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
            expect(gasPrice.slow.maxPriorityFeePerGas).toBeGreaterThan(
                BigInt(0)
            )

            expect(typeof gasPrice.standard.maxFeePerGas).toBe("bigint")
            expect(gasPrice.standard.maxFeePerGas).toBeGreaterThan(BigInt(0))

            expect(typeof gasPrice.standard.maxPriorityFeePerGas).toBe("bigint")
            expect(gasPrice.standard.maxPriorityFeePerGas).toBeGreaterThan(
                BigInt(0)
            )

            expect(typeof gasPrice.fast.maxFeePerGas).toBe("bigint")
            expect(gasPrice.fast.maxFeePerGas).toBeGreaterThan(BigInt(0))

            expect(typeof gasPrice.fast.maxPriorityFeePerGas).toBe("bigint")
            expect(gasPrice.fast.maxPriorityFeePerGas).toBeGreaterThan(
                BigInt(0)
            )
        })

        test("fetch user operation status", async () => {})
    })

    describe("Pimlico paymaster actions ", () => {
        test("Fetching paymaster and data", async () => {
            const eoaWalletClient = getEoaWalletClient()
            const publicClient = await getPublicClient()
            const { maxFeePerGas, maxPriorityFeePerGas } =
                await publicClient.estimateFeesPerGas()

            const partialUserOp = await buildUserOp(eoaWalletClient)

            const userOperation: UserOperation = {
                ...partialUserOp,
                maxFeePerGas: maxFeePerGas || 0n,
                maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
                callGasLimit: 0n,
                verificationGasLimit: 0n,
                preVerificationGas: 0n
            }

            const entryPoint = getEntryPoint()

            const sponsorUserOperationPaymasterAndData =
                await pimlicoPaymasterClient.sponsorUserOperation({
                    userOperation: userOperation,
                    entryPoint: entryPoint
                })

            expect(sponsorUserOperationPaymasterAndData).not.toBeNull()
            expect(sponsorUserOperationPaymasterAndData).not.toBeUndefined()
            expect(sponsorUserOperationPaymasterAndData).not.toBeUndefined()

            expect(
                typeof sponsorUserOperationPaymasterAndData.callGasLimit
            ).toBe("bigint")
            expect(
                sponsorUserOperationPaymasterAndData.callGasLimit
            ).toBeGreaterThan(BigInt(0))

            expect(
                typeof sponsorUserOperationPaymasterAndData.preVerificationGas
            ).toBe("bigint")
            expect(
                sponsorUserOperationPaymasterAndData.preVerificationGas
            ).toBeGreaterThan(BigInt(0))

            expect(
                typeof sponsorUserOperationPaymasterAndData.verificationGasLimit
            ).toBe("bigint")
            expect(
                sponsorUserOperationPaymasterAndData.verificationGasLimit
            ).toBeGreaterThan(BigInt(0))

            expect(
                sponsorUserOperationPaymasterAndData.paymasterAndData
            ).not.toBeEmpty()
            expect(
                sponsorUserOperationPaymasterAndData.paymasterAndData
            ).toStartWith("0x")
            await waitForNonceUpdate()
        }, 100000)

        test("Sending user op with paymaster and data", async () => {
            const entryPoint = getEntryPoint()
            const eoaWalletClient = getEoaWalletClient()
            const chain = getTestingChain()

            const userOperation = await buildUserOp(eoaWalletClient)

            const sponsorUserOperationPaymasterAndData =
                await pimlicoPaymasterClient.sponsorUserOperation({
                    userOperation: userOperation,
                    entryPoint: entryPoint
                })

            userOperation.paymasterAndData =
                sponsorUserOperationPaymasterAndData.paymasterAndData
            userOperation.callGasLimit =
                sponsorUserOperationPaymasterAndData.callGasLimit
            userOperation.verificationGasLimit =
                sponsorUserOperationPaymasterAndData.verificationGasLimit
            userOperation.preVerificationGas =
                sponsorUserOperationPaymasterAndData.preVerificationGas

            const userOperationHash = getUserOperationHash({
                userOperation,
                entryPoint,
                chainId: chain.id
            })

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

            const userOperationReceipt =
                await pimlicoBundlerClient.waitForUserOperationReceipt({
                    hash: userOpHash
                })

            expect(userOperationReceipt).not.toBeNull()
            expect(userOperationReceipt?.userOpHash).toBe(userOpHash)
            expect(
                userOperationReceipt?.receipt.transactionHash
            ).not.toBeEmpty()
            expect(userOperationReceipt?.receipt.transactionHash).not.toBeNull()
            expect(
                userOperationReceipt?.receipt.transactionHash
            ).not.toBeUndefined()

            const userOperationFromUserOpHash =
                await pimlicoBundlerClient.getUserOperationByHash({
                    hash: userOpHash
                })

            expect(userOperationFromUserOpHash).not.toBeNull()
            expect(userOperationFromUserOpHash?.entryPoint).toBe(entryPoint)
            expect(userOperationFromUserOpHash?.transactionHash).toBe(
                userOperationReceipt?.receipt.transactionHash
            )

            // for (const key in userOperationFromUserOpHash?.userOperation) {
            //     expect(userOperationFromUserOpHash?.userOperation[key]).toBe(userOperation[key])
            // }

            const userOperationStatus =
                await pimlicoBundlerClient.getUserOperationStatus({
                    hash: userOpHash
                })

            expect(userOperationStatus).not.toBeNull()
            expect(userOperationStatus).not.toBeUndefined()

            expect(userOperationStatus.status).toBe("included")
            expect(userOperationStatus.transactionHash).toBe(
                userOperationReceipt?.receipt.transactionHash
            )
            await waitForNonceUpdate()
        }, 100000)
    })

    test("Validating sponsorship policies", async () => {
        const eoaWalletClient = getEoaWalletClient()
        const publicClient = await getPublicClient()
        const { maxFeePerGas, maxPriorityFeePerGas } =
            await publicClient.estimateFeesPerGas()

        const partialUserOp = await buildUserOp(eoaWalletClient)

        const userOperation: UserOperation = {
            ...partialUserOp,
            maxFeePerGas: maxFeePerGas || 0n,
            maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
            callGasLimit: 0n,
            verificationGasLimit: 0n,
            preVerificationGas: 0n
        }

        const entryPoint = getEntryPoint()

        const validateSponsorshipPolicies =
            await pimlicoPaymasterClient.validateSponsorshipPolicies({
                userOperation: userOperation,
                entryPoint: entryPoint,
                sponsorshipPolicyIds: ["sp_shiny_puma", "sp_fake_policy"]
            })

        expect(validateSponsorshipPolicies).not.toBeNull()
        expect(validateSponsorshipPolicies).not.toBeUndefined()
        expect(validateSponsorshipPolicies).not.toBeEmpty()
        expect(validateSponsorshipPolicies).toBeArray()
        expect(validateSponsorshipPolicies.length).toBe(1)
        await waitForNonceUpdate()
    }, 100000)
})
