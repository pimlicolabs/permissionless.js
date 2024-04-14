import {
    type BundlerClient,
    WaitForUserOperationReceiptTimeoutError
} from "permissionless"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    UserOperation
} from "permissionless/types"
import {
    ENTRYPOINT_ADDRESS_V06,
    getUserOperationHash
} from "permissionless/utils"
import {
    type Account,
    type Chain,
    type Transport,
    type WalletClient,
    zeroAddress,
    type PublicClient,
    isHash
} from "viem"
import { foundry } from "viem/chains"
import {
    fund,
    getAnvilWalletClient,
    getBundlerClient,
    getPimlicoBundlerClient,
    getPublicClient,
    setupSimpleSmartAccountClient
} from "../utils"
import type { PimlicoBundlerClient } from "permissionless/clients/pimlico"

describe("BUNDLER ACTIONS", () => {
    let publicClient: PublicClient<Transport, Chain>
    let walletClient: WalletClient<Transport, Chain, Account>
    let bundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE, Chain>
    let pimlicoBundlerClient: PimlicoBundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE>

    beforeAll(async () => {
        publicClient = getPublicClient()
        walletClient = getAnvilWalletClient(94)
        bundlerClient = getBundlerClient(ENTRYPOINT_ADDRESS_V06)
        pimlicoBundlerClient = getPimlicoBundlerClient(ENTRYPOINT_ADDRESS_V06)
    })

    test("can handle eth_supportedEntryPoints", async () => {
        const supportedEntryPoints = await bundlerClient.supportedEntryPoints()

        expect(Array.isArray(supportedEntryPoints)).toBe(true)
        expect(supportedEntryPoints.length).toBeGreaterThan(0)
        expect(supportedEntryPoints.includes(ENTRYPOINT_ADDRESS_V06)).toBe(true)
    })

    test("can handle eth_chainId", async () => {
        const chainId = await bundlerClient.chainId()

        expect(chainId).toBeGreaterThan(0)
        expect(chainId === foundry.id).toBe(true)
    })

    test("can handle eth_estimateUserOperationGas", async () => {
        const simpleAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        const userOperation =
            (await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                        data: "0x",
                        value: 0n
                    })
                }
            })) as UserOperation<"v0.6">

        const { preVerificationGas, verificationGasLimit, callGasLimit } =
            await bundlerClient.estimateUserOperationGas({
                userOperation
            })

        expect(preVerificationGas).toBeTruthy()
        expect(verificationGasLimit).toBeTruthy()
        expect(callGasLimit).toBeTruthy()
    }, 10000)

    test("can handle eth_sendUserOperation", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        await fund(smartAccountClient.account.address, walletClient)

        const userOperation =
            await smartAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: "0x"
                }
            })

        userOperation.signature =
            await smartAccountClient.account.signUserOperation(userOperation)

        const opHash = await bundlerClient.sendUserOperation({
            userOperation
        })

        expect(isHash(opHash)).toBe(true)

        const userOperationReceipt =
            await bundlerClient.waitForUserOperationReceipt({
                hash: opHash
            })
        expect(userOperationReceipt).not.toBeNull()
        expect(userOperationReceipt?.userOpHash).toBe(opHash)
        expect(userOperationReceipt?.receipt.transactionHash).toBeTruthy()

        const receipt = await bundlerClient.getUserOperationReceipt({
            hash: opHash
        })

        expect(receipt?.receipt.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )

        const userOperationFromUserOpHash =
            await bundlerClient.getUserOperationByHash({ hash: opHash })

        expect(userOperationFromUserOpHash).not.toBeNull()
        expect(userOperationFromUserOpHash?.entryPoint).toBe(
            ENTRYPOINT_ADDRESS_V06
        )
        expect(userOperationFromUserOpHash?.transactionHash).toBe(
            userOperationReceipt?.receipt.transactionHash
        )

        for (const key in userOperationFromUserOpHash?.userOperation) {
            const expected = userOperationFromUserOpHash?.userOperation[key]
            const actual = userOperation[key]

            if (typeof expected === "string" && typeof actual === "string") {
                expect(expected.toLowerCase()).toBe(actual.toLowerCase())
            } else {
                expect(expected).toBe(actual)
            }
        }
    }, 10000)

    test("wait for user operation receipt fail", async () => {
        const smartAccountClient = await setupSimpleSmartAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06
        })

        await fund(smartAccountClient.account.address, walletClient)

        const userOperation =
            await smartAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await smartAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    })
                }
            })

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            userOperation
        })

        userOperation.callGasLimit = gasParameters.callGasLimit
        userOperation.verificationGasLimit = gasParameters.verificationGasLimit
        userOperation.preVerificationGas = gasParameters.preVerificationGas

        const userOpHash = getUserOperationHash({
            userOperation,
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            chainId: foundry.id
        })

        await expect(async () =>
            bundlerClient.waitForUserOperationReceipt({
                hash: userOpHash,
                timeout: 100
            })
        ).rejects.toThrow(WaitForUserOperationReceiptTimeoutError)
    })
})
