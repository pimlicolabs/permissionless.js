import { zeroAddress } from "viem"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getCoreSmartAccounts } from "../../../permissionless-test/src/utils"
import { accountId } from "./accountId"

describe.each(getCoreSmartAccounts())(
    "accountId $name",
    ({ getErc7579SmartAccountClient }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "accountId",
            async ({ rpc }) => {
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const smartClient = await getErc7579SmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                const accountIdBeforeDeploy = await accountId(smartClient)

                // deploy account
                await smartClient.sendTransaction({
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                })

                const postDeployAccountId = await accountId(smartClient)

                expect(accountIdBeforeDeploy).toBe(postDeployAccountId)
            }
        )
    }
)
