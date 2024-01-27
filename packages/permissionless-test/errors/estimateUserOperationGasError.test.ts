import dotenv from "dotenv"
import {
    EstimateUserOperationGasError,
    InitCodeRevertedError,
    InvalidSmartAccountNonceError,
    PaymasterDepositTooLowError,
    PaymasterNotDeployedError,
    SenderAddressMismatchError,
    SenderAlreadyDeployedError,
    SenderNotDeployedError,
    SmartAccountInsufficientFundsError
} from "permissionless/errors"
import { beforeAll, describe, expect, test } from "vitest"
import { buildUserOp, getAccountInitCode } from "../userOp"
import {
    getBundlerClient,
    getEntryPoint,
    getEoaWalletClient,
    getFactoryAddress
} from "../utils"

dotenv.config()

beforeAll(() => {
    if (!process.env.FACTORY_ADDRESS) {
        throw new Error("FACTORY_ADDRESS environment variable not set")
    }
    if (!process.env.TEST_PRIVATE_KEY) {
        throw new Error("TEST_PRIVATE_KEY environment variable not set")
    }
    if (!process.env.RPC_URL) {
        throw new Error("RPC_URL environment variable not set")
    }
    if (!process.env.ENTRYPOINT_ADDRESS) {
        throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
    }
})

describe("estimateUserOperationGasError", async () => {
    test("SenderAlreadyDeployedError", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const index = 0n
        const userOperation = await buildUserOp(eoaWalletClient, index)

        const factoryAddress = getFactoryAddress()
        userOperation.initCode = await getAccountInitCode(
            factoryAddress,
            eoaWalletClient,
            index
        )

        const bundlerClient = getBundlerClient()

        await expect(async () => {
            try {
                await bundlerClient.estimateUserOperationGas({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
            } catch (err) {
                const estimationError = err as EstimateUserOperationGasError

                throw estimationError.cause
            }
            throw new Error("Should have thrown")
        }).rejects.toBeInstanceOf(SenderAlreadyDeployedError)
    })

    test("InitCodeRevertedError", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const index = 1n

        const userOperation = await buildUserOp(eoaWalletClient, index)

        userOperation.initCode =
            "0x9406Cc6185a345906296840746125a0E449764545fbfb9cf000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000000000000000000"

        const bundlerClient = getBundlerClient()

        await expect(async () => {
            try {
                await bundlerClient.estimateUserOperationGas({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
            } catch (err) {
                const estimationError = err as EstimateUserOperationGasError

                throw estimationError.cause
            }
            throw new Error("Should have thrown")
        }).rejects.toBeInstanceOf(InitCodeRevertedError)
    })

    test("SenderAddressMismatchError", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const index = 2n

        const userOperation = await buildUserOp(eoaWalletClient, index)

        userOperation.initCode =
            "0x9406Cc6185a346906296840746125a0E449764545fbfb9cf000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000000000000000000"

        const bundlerClient = getBundlerClient()

        await expect(async () => {
            try {
                await bundlerClient.estimateUserOperationGas({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
            } catch (err) {
                const estimationError = err as EstimateUserOperationGasError

                throw estimationError.cause
            }
            throw new Error("Should have thrown")
        }).rejects.toBeInstanceOf(SenderAddressMismatchError)
    })

    test("InitCodeDidNotDeploySenderError", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const index = 2n

        const userOperation = await buildUserOp(eoaWalletClient, index)

        userOperation.initCode =
            "0x9406Cc6185a346906296840746125a0E449764545fbfb9cf000000000000000000000000x39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000000"

        // TODO: FInd init code that does not deploy sender

        // const bundlerClient = getBundlerClient()

        // await expect(async () => {
        //     try {
        //         await bundlerClient.estimateUserOperationGas({
        //             userOperation,
        //             entryPoint: getEntryPoint()
        //         })
        //     } catch (err) {
        //         const estimationError =
        //             err as EstimateUserOperationGasError

        //         throw estimationError.cause
        //     }
        //     throw new Error("Should have thrown")
        // }).rejects.toBeInstanceOf(InitCodeDidNotDeploySenderError)
    })

    test("SenderNotDeployedError", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const index = 2n

        const userOperation = await buildUserOp(eoaWalletClient, index)

        userOperation.initCode = "0x"

        const bundlerClient = getBundlerClient()

        await expect(async () => {
            try {
                await bundlerClient.estimateUserOperationGas({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
            } catch (err) {
                const estimationError = err as EstimateUserOperationGasError

                throw estimationError.cause
            }
            throw new Error("Should have thrown")
        }).rejects.toBeInstanceOf(SenderNotDeployedError)
    })

    test("SmartAccountInsufficientFundsError", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const index = 0n

        const userOperation = await buildUserOp(eoaWalletClient, index)

        userOperation.initCode = "0x"

        const bundlerClient = getBundlerClient()

        await expect(async () => {
            try {
                await bundlerClient.estimateUserOperationGas(
                    {
                        userOperation,
                        entryPoint: getEntryPoint()
                    },
                    {
                        [userOperation.sender]: { balance: 0n }
                    }
                )
            } catch (err) {
                const estimationError = err as EstimateUserOperationGasError

                throw estimationError.cause
            }
            throw new Error("Should have thrown")
        }).rejects.toBeInstanceOf(SmartAccountInsufficientFundsError)
    })

    test("InvalidSmartAccountNonceError", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const index = 0n

        const userOperation = await buildUserOp(eoaWalletClient, index)

        userOperation.nonce = 0n

        const bundlerClient = getBundlerClient()

        await expect(async () => {
            try {
                await bundlerClient.estimateUserOperationGas({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
            } catch (err) {
                const estimationError = err as EstimateUserOperationGasError

                throw estimationError.cause
            }
            throw new Error("Should have thrown")
        }).rejects.toBeInstanceOf(InvalidSmartAccountNonceError)
    })

    test("PaymasterNotDeployedError", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const index = 0n

        const userOperation = await buildUserOp(eoaWalletClient, index)

        userOperation.paymasterAndData =
            "0x793C9C5D01AA56FEf7f39bfC05256486F9dEB1b0"

        const bundlerClient = getBundlerClient()

        await expect(async () => {
            try {
                await bundlerClient.estimateUserOperationGas({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
            } catch (err) {
                const estimationError = err as EstimateUserOperationGasError

                throw estimationError.cause
            }
            throw new Error("Should have thrown")
        }).rejects.toBeInstanceOf(PaymasterNotDeployedError)
    })

    test("PaymasterDepositTooLowError", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const index = 0n

        const userOperation = await buildUserOp(eoaWalletClient, index)

        userOperation.paymasterAndData =
            "0x2C6626618678dE393f0A0467E960B34Aaab969Be"

        const bundlerClient = getBundlerClient()

        await expect(async () => {
            try {
                await bundlerClient.estimateUserOperationGas({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
            } catch (err) {
                const estimationError = err as EstimateUserOperationGasError

                throw estimationError.cause
            }
            throw new Error("Should have thrown")
        }).rejects.toBeInstanceOf(PaymasterDepositTooLowError)
    })
})
