import dotenv from "dotenv"
import { bundlerActions } from "permissionless"
import { pimlicoBundlerActions } from "permissionless/actions/pimlico"
import { beforeAll, describe, test } from "vitest"
import { buildUserOp } from "../userOp"
import {
    getBundlerClient,
    getEntryPoint,
    getEoaWalletClient,
    getPimlicoPaymasterClient,
    getSignerToSafeSmartAccount,
    getSmartAccountClient
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

describe("sendUserOperation", async () => {
    test("SenderAlreadyDeployedError", async () => {
        const safeSmartAccount = await getSignerToSafeSmartAccount()

        const paymasterClient = getPimlicoPaymasterClient()

        const smartAccountClient = (
            await getSmartAccountClient({
                account: safeSmartAccount,
                sponsorUserOperation: async (args) => {
                    const userOp =
                        await paymasterClient.sponsorUserOperation(args)

                    return {
                        ...userOp,
                        initCode: "0x"
                    }
                }
            })
        ).extend(pimlicoBundlerActions)

        await smartAccountClient.sendTransaction({
            to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
            value: 0n,
            data: "0x1234"
        })
    })
})
