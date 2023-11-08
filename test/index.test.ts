import { beforeAll, describe, expect, test } from "bun:test"
import dotenv from "dotenv"
import { UserOperation, getSenderAddress, getUserOperationHash } from "permissionless"
import { signUserOperationHashWithECDSA } from "permissionless/utils"
import { buildUserOp, getAccountInitCode } from "./userOp.js"
import {
    getBundlerClient,
    getEntryPoint,
    getEoaWalletClient,
    getFactoryAddress,
    getPrivateKeyAccount,
    getPublicClient,
    getTestingChain
} from "./utils.js"

dotenv.config()
const pimlicoApiKey = process.env.PIMLICO_API_KEY

beforeAll(() => {
    if (!process.env.PIMLICO_API_KEY) throw new Error("PIMLICO_API_KEY environment variable not set")
    if (!process.env.STACKUP_API_KEY) throw new Error("STACKUP_API_KEY environment variable not set")
    if (!process.env.FACTORY_ADDRESS) throw new Error("FACTORY_ADDRESS environment variable not set")
    if (!process.env.TEST_PRIVATE_KEY) throw new Error("TEST_PRIVATE_KEY environment variable not set")
    if (!process.env.RPC_URL) throw new Error("RPC_URL environment variable not set")
    if (!process.env.ENTRYPOINT_ADDRESS) throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
})

describe("test public actions and utils", () => {
    test("get sender address", async () => {
        const eoaWalletClient = getEoaWalletClient()
        const factoryAddress = getFactoryAddress()

        const initCode = await getAccountInitCode(factoryAddress, eoaWalletClient)
        const publicClient = await getPublicClient()
        const entryPoint = getEntryPoint()

        const sender = await getSenderAddress(publicClient, {
            initCode,
            entryPoint
        })

        expect(sender).not.toBeNull()
        expect(sender).not.toBeUndefined()
        expect(sender).not.toBeEmpty()
        expect(sender).toStartWith("0x")
    })

    test("get sender address with invalid entry point", async () => {
        const eoaWalletClient = getEoaWalletClient()
        const factoryAddress = getFactoryAddress()

        const initCode = await getAccountInitCode(factoryAddress, eoaWalletClient)
        const publicClient = await getPublicClient()
        const entryPoint = "0x0000000"

        await expect(async () => {
            await getSenderAddress(publicClient, {
                initCode,
                entryPoint
            })
        }).toThrow()
    })

    test("getUserOperationHash", async () => {
        const eoaWalletClient = getEoaWalletClient()
        const publicClient = await getPublicClient()
        const chain = getTestingChain()
        const entryPoint = getEntryPoint()
        const bundlerClient = getBundlerClient()

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
            entryPoint: entryPoint
        })

        userOperation.callGasLimit = gasParameters.callGasLimit
        userOperation.verificationGasLimit = gasParameters.verificationGasLimit
        userOperation.preVerificationGas = gasParameters.preVerificationGas

        const userOpHash = getUserOperationHash({
            userOperation,
            entryPoint,
            chainId: chain.id
        })

        expect(userOpHash).toBeString()
        expect(userOpHash).toStartWith("0x")
    })

    test("signUserOperationHashWithECDSA", async () => {
        const bundlerClient = getBundlerClient()
        const eoaWalletClient = getEoaWalletClient()
        const publicClient = await getPublicClient()
        const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas()

        const userOperation: UserOperation = {
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

        const userOpHash = getUserOperationHash({
            userOperation,
            entryPoint,
            chainId: chain.id
        })

        userOperation.signature = await signUserOperationHashWithECDSA({
            client: eoaWalletClient,
            userOperation,
            entryPoint: entryPoint,
            chainId: chain.id
        })

        expect(userOperation.signature).not.toBeEmpty()
        expect(userOperation.signature).toBeString()
        expect(userOperation.signature).toStartWith("0x")

        const signature = await signUserOperationHashWithECDSA({
            client: eoaWalletClient,
            hash: userOpHash
        })

        await signUserOperationHashWithECDSA({
            account: eoaWalletClient.account,
            hash: userOpHash
        })

        await signUserOperationHashWithECDSA({
            account: eoaWalletClient.account,
            userOperation,
            entryPoint: entryPoint,
            chainId: chain.id
        })

        await signUserOperationHashWithECDSA({
            account: getPrivateKeyAccount(),
            userOperation,
            entryPoint: entryPoint,
            chainId: chain.id
        })

        expect(signature).not.toBeEmpty()
        expect(signature).toBeString()
        expect(signature).toStartWith("0x")

        expect(signature).toEqual(userOperation.signature)
    })
})
