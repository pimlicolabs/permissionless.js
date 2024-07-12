import { zeroAddress } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient
} from "../../../permissionless-test/src/utils"
import { ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { accountId } from "./accountId"

describe.each(getCoreSmartAccounts())(
    "accountId $name",
    ({ getErc7579SmartAccountClient }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "accountId",
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

                const accountIdBeforeDeploy = await accountId(
                    smartClient as any
                )

                // deploy account
                await smartClient.sendTransaction({
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                })

                const postDeployAccountId = await accountId(smartClient as any)

                expect(accountIdBeforeDeploy).toBe(postDeployAccountId)
            }
        )
    }
)
