import dotenv from "dotenv"
import { UserOperation } from "permissionless"
import {
    PimlicoBundlerClient,
    PimlicoPaymasterClient
} from "permissionless/clients/pimlico"
import { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types"
import { getUserOperationHash } from "permissionless/utils"
import { Hash, Hex } from "viem"
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
    getEntryPoint,
    getEoaWalletClient,
    getPimlicoBundlerClient,
    getPimlicoPaymasterClient,
    getPublicClient,
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
    if (!process.env.ACTIVE_SPONSORSHIP_POLICY)
        throw new Error(
            "ACTIVE_SPONSORSHIP_POLICY environment variable not set"
        )
})

describe("Pimlico Actions tests", () => {
    let pimlicoBundlerClient: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>
    let pimlicoPaymasterClient: PimlicoPaymasterClient<ENTRYPOINT_ADDRESS_V06_TYPE>

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
            const userOperation: UserOperation<"v0.6"> = {
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
                    userOperation: userOperation
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
            ).length.greaterThan(0)
            expectTypeOf(
                sponsorUserOperationPaymasterAndData.paymasterAndData
            ).toMatchTypeOf<Hex>()
            await waitForNonceUpdate()
        }, 100000)
        test("Sending user op with paymaster and data", async () => {
            const entryPoint = getEntryPoint()
            const eoaWalletClient = getEoaWalletClient()
            const chain = getTestingChain()
            const userOperation = await buildUserOp(eoaWalletClient)
            const sponsorUserOperationPaymasterAndData =
                await pimlicoPaymasterClient.sponsorUserOperation({
                    userOperation: userOperation
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
                userOperation: userOperation
            })
            expectTypeOf(userOpHash).toBeString()
            expectTypeOf(userOpHash).toMatchTypeOf<Hash>()
            const userOperationReceipt =
                await pimlicoBundlerClient.waitForUserOperationReceipt({
                    hash: userOpHash
                })
            expect(userOperationReceipt).not.toBeNull()
            expect(userOperationReceipt?.userOpHash).toBe(userOpHash)
            expect(
                userOperationReceipt?.receipt.transactionHash
            ).length.greaterThan(0)
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
            await waitForNonceUpdate()
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

        if (!process.env.ACTIVE_SPONSORSHIP_POLICY)
            throw new Error(
                "ACTIVE_SPONSORSHIP_POLICY environment variable not set"
            )

        const partialUserOp = await buildUserOp(eoaWalletClient)

        const userOperation: UserOperation<"v0.6"> = {
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
                sponsorshipPolicyIds: [
                    process.env.ACTIVE_SPONSORSHIP_POLICY,
                    "sp_fake_policy"
                ]
            })

        expect(validateSponsorshipPolicies).not.toBeNull()
        expect(validateSponsorshipPolicies).not.toBeUndefined()
        expect(validateSponsorshipPolicies).length.greaterThan(0)
        expectTypeOf(validateSponsorshipPolicies).toBeArray()
        expect(validateSponsorshipPolicies.length).toBe(1)
        await waitForNonceUpdate()
    }, 100000)
})
