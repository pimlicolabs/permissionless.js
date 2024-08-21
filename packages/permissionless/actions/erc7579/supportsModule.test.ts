import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getCoreSmartAccounts } from "../../../permissionless-test/src/utils"
import { supportsModule } from "./supportsModule"

describe.each(getCoreSmartAccounts())(
    "supportsModule $name",
    ({ getErc7579SmartAccountClient }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "supportsModule",
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

                const supportsValidationModule = await supportsModule(
                    smartClient,
                    {
                        account: smartClient.account,
                        type: "validator"
                    }
                )

                expect(supportsValidationModule).toBe(true)
            }
        )
    }
)
