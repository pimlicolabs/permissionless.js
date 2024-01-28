import dotenv from "dotenv"
import { beforeAll, describe, test } from "vitest"
import {
    getBundlerClient,
    getEntryPoint,
    getEoaWalletClient,
    getPimlicoPaymasterClient,
    getSignerToSafeSmartAccount,
    getSmartAccountClient
} from "../utils"
import { bundlerActions } from "permissionless"
import { pimlicoBundlerActions } from "permissionless/actions/pimlico"
import { buildUserOp } from "../userOp"

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

describe("sendUserOperation", async () => {
    test("SenderAlreadyDeployedError", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const index = 0n

        const userOperation = await buildUserOp(eoaWalletClient, index)

        userOperation.initCode = "0x"
        userOperation.preVerificationGas = 100_000n
        userOperation.verificationGasLimit = 100_000n
        userOperation.callGasLimit = 100_000n

        const bundlerClient = getBundlerClient()

        await bundlerClient.sendUserOperation({
            userOperation,
            entryPoint: getEntryPoint()
        })
    })
})
