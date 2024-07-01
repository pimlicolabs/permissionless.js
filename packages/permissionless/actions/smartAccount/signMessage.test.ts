import type { Chain, Client, Transport } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import type { SmartAccount } from "../../accounts"
import type { EntryPoint } from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06 } from "../../utils"
import { signMessage } from "./signMessage"

describe.each(getCoreSmartAccounts())(
    "signMessage $name",
    ({ getSmartAccountClient, isEip1271Compliant }) => {
        testWithRpc.skipIf(isEip1271Compliant)(
            "not isEip1271Compliant",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V06,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V06,
                        paymasterRpc
                    })
                })

                await expect(async () =>
                    signMessage(
                        smartClient as Client<
                            Transport,
                            Chain,
                            SmartAccount<EntryPoint>
                        >,
                        {
                            message:
                                "slowly and steadily burning the private keys"
                        }
                    )
                ).rejects.toThrow()
            }
        )

        testWithRpc.skipIf(!isEip1271Compliant)(
            "isEip1271Compliant",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V06,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V06,
                        paymasterRpc
                    })
                })

                const signature = await signMessage(
                    smartClient as Client<
                        Transport,
                        Chain,
                        SmartAccount<EntryPoint>
                    >,
                    {
                        message: "slowly and steadily burning the private keys"
                    }
                )

                const publicClient = getPublicClient(anvilRpc)

                const isVerified = await publicClient.verifyMessage({
                    address: smartClient.account.address,
                    message: "slowly and steadily burning the private keys",
                    signature
                })

                expect(isVerified).toBeTruthy()
            }
        )
    }
)
