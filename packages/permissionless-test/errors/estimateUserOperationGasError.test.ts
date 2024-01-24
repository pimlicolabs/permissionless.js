import dotenv from "dotenv"
import { beforeAll, describe, expect, test } from "vitest"
import { buildUserOp, getAccountInitCode } from "../userOp"
import {
    getBundlerClient,
    getEntryPoint,
    getEoaWalletClient,
    getFactoryAddress
} from "../utils"
import { EstimateUserOperationGasExecutionError } from "permissionless/errors"

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
    test("SenderAlreadyDeployed", async () => {
        const eoaWalletClient = getEoaWalletClient()

        const userOperation = await buildUserOp(eoaWalletClient)

        const factoryAddress = getFactoryAddress()
        userOperation.initCode = await getAccountInitCode(
            factoryAddress,
            eoaWalletClient
        )

        const bundlerClient = getBundlerClient()

        await bundlerClient.estimateUserOperationGas({
            userOperation,
            entryPoint: getEntryPoint()
        })
    })
})
