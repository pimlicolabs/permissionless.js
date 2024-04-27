import { type BundlerClient, ENTRYPOINT_ADDRESS_V07 } from "permissionless"
import type {
    PimlicoBundlerClient,
    PimlicoPaymasterClient
} from "permissionless/clients/pimlico"
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types"
import {
    type Account,
    type Chain,
    type PublicClient,
    type Transport,
    type WalletClient,
    isAddress,
    isHash,
    zeroAddress
} from "viem"
import {
    getAnvilWalletClient,
    getBundlerClient,
    getPimlicoBundlerClient,
    getPimlicoPaymasterClient,
    getPublicClient,
    getSimpleAccountClient
} from "../utils"

describe("Pimlico Actions tests", () => {
    let publicClient: PublicClient<Transport, Chain>
    let walletClient: WalletClient<Transport, Chain, Account>
    let bundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE, Chain>
    let pimlicoBundlerClient: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>
    let pimlicoPaymasterClient: PimlicoPaymasterClient<ENTRYPOINT_ADDRESS_V07_TYPE>

    beforeAll(async () => {
        publicClient = getPublicClient()
        walletClient = getAnvilWalletClient(97)
        bundlerClient = getBundlerClient(ENTRYPOINT_ADDRESS_V07)
        pimlicoBundlerClient = getPimlicoBundlerClient(ENTRYPOINT_ADDRESS_V07)
        pimlicoPaymasterClient = getPimlicoPaymasterClient(
            ENTRYPOINT_ADDRESS_V07
        )
    })

    describe("Pimlico Bundler actions", () => {
        test("can fetch gas prices", async () => {
            const gasPrice =
                await pimlicoBundlerClient.getUserOperationGasPrice()
            expect(gasPrice).toBeTruthy()
            expect(gasPrice.slow).toBeTruthy()
            expect(gasPrice.standard).toBeTruthy()
            expect(gasPrice.fast).toBeTruthy()
            expect(typeof gasPrice.slow.maxFeePerGas).toBe("bigint")
            expect(gasPrice.slow.maxFeePerGas).toBeGreaterThan(0n)
            expect(typeof gasPrice.slow.maxPriorityFeePerGas).toBe("bigint")
            expect(gasPrice.slow.maxPriorityFeePerGas).toBeGreaterThan(0n)
            expect(typeof gasPrice.standard.maxFeePerGas).toBe("bigint")
            expect(gasPrice.standard.maxFeePerGas).toBeGreaterThan(0n)
            expect(typeof gasPrice.standard.maxPriorityFeePerGas).toBe("bigint")
            expect(gasPrice.standard.maxPriorityFeePerGas).toBeGreaterThan(0n)
            expect(typeof gasPrice.fast.maxFeePerGas).toBe("bigint")
            expect(gasPrice.fast.maxFeePerGas).toBeGreaterThan(0n)
            expect(typeof gasPrice.fast.maxPriorityFeePerGas).toBe("bigint")
            expect(gasPrice.fast.maxPriorityFeePerGas).toBeGreaterThan(0n)
        })
        test("fetch user operation status", async () => {})
    })

    describe("Pimlico paymaster actions ", () => {
        test("can fetching paymaster and data", async () => {
            const simpleAccountClient = await getSimpleAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V07
            })

            const userOperation =
                await simpleAccountClient.prepareUserOperationRequest({
                    userOperation: {
                        callData:
                            await simpleAccountClient.account.encodeCallData({
                                to: zeroAddress,
                                value: 0n,
                                data: "0x69"
                            })
                    }
                })

            const result = await pimlicoPaymasterClient.sponsorUserOperation({
                userOperation: userOperation
            })

            expect(result).toBeTruthy()
            expect(typeof result.callGasLimit).toBe("bigint")
            expect(result.callGasLimit).toBeGreaterThan(0n)
            expect(typeof result.preVerificationGas).toBe("bigint")
            expect(result.preVerificationGas).toBeGreaterThan(0n)
            expect(typeof result.verificationGasLimit).toBe("bigint")
            expect(result.verificationGasLimit).toBeGreaterThan(0n)
            expect(result.paymasterData.length).toBeGreaterThan(0)
            expect(
                result.paymaster === undefined || isAddress(result.paymaster)
            ).toBeTruthy()
        }, 100000)

        test("can send userOperation with returned paymaster and data", async () => {
            const simpleAccountClient = await getSimpleAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V07
            })

            let op = await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    })
                }
            })

            const result = await pimlicoPaymasterClient.sponsorUserOperation({
                userOperation: op
            })

            op = { ...op, ...result }
            op.signature =
                await simpleAccountClient.account.signUserOperation(op)

            const opHash = await pimlicoBundlerClient.sendUserOperation({
                userOperation: op
            })

            expect(isHash(opHash)).toBe(true)

            const userOperationReceipt =
                await pimlicoBundlerClient.waitForUserOperationReceipt({
                    hash: opHash
                })

            expect(userOperationReceipt).toBeTruthy()
            expect(userOperationReceipt?.userOpHash).toBe(opHash)
            expect(
                userOperationReceipt?.receipt.transactionHash.length
            ).toBeGreaterThan(0)
            expect(userOperationReceipt?.receipt.transactionHash).toBeTruthy()

            //const userOperationFromUserOpHash =
            //    await pimlicoBundlerClient.getUserOperationByHash({
            //        hash: opHash
            //    })

            //expect(userOperationFromUserOpHash).toBeTruthy()
            //expect(userOperationFromUserOpHash?.entryPoint).toBe(
            //    ENTRYPOINT_ADDRESS_V07
            //)
            //expect(userOperationFromUserOpHash?.transactionHash).toBe(
            //    userOperationReceipt?.receipt.transactionHash
            //)

            //// for (const key in userOperationFromUserOpHash?.userOperation) {
            ////     expect(userOperationFromUserOpHash?.userOperation[key]).toBe(userOperation[key])
            //// }

            //const userOperationStatus =
            //    await pimlicoBundlerClient.getUserOperationStatus({
            //        hash: opHash
            //    })

            //expect(userOperationStatus).toBeTruthy()
            //expect(userOperationStatus.status).toBe("included")
            //expect(userOperationStatus.transactionHash).toBe(
            //    userOperationReceipt?.receipt.transactionHash
            //)
        }, 100000)
    })

    test("Validating sponsorship policies", async () => {
        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

        const userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    })
                }
            })

        const validateSponsorshipPolicies =
            await pimlicoPaymasterClient.validateSponsorshipPolicies({
                userOperation,
                sponsorshipPolicyIds: ["sp_crazy_kangaroo"]
            })

        expect(validateSponsorshipPolicies).toBeTruthy()
        expect(validateSponsorshipPolicies.length).toBeGreaterThan(0)
        expect(Array.isArray(validateSponsorshipPolicies)).toBeTruthy()
        expect(validateSponsorshipPolicies.length).toBe(1)
    }, 100000)
})
