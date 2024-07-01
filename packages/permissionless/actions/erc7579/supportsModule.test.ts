import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient
} from "../../../permissionless-test/src/utils"
import { ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { supportsModule } from "./supportsModule"

describe.each(getCoreSmartAccounts())(
    "supportsModule $name",
    ({ getErc7579SmartAccountClient }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "supportsModule",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const smartClient = await getErc7579SmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V07,
                        paymasterRpc
                    })
                })

                const supportsValidationModule = await supportsModule(
                    smartClient as any,
                    {
                        account: smartClient.account as any,
                        type: "validator"
                    }
                )

                expect(supportsValidationModule).toBe(true)
            }
        )
    }
)
