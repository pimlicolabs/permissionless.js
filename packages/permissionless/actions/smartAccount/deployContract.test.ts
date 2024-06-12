import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient
} from "../../../permissionless-test/src/utils"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"

describe.each(getCoreSmartAccounts())(
    "deployContract $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07
    }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "deployContract_V06",
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
                    smartClient.deployContract({
                        abi: [],
                        bytecode: "0xff66"
                    })
                ).rejects.toThrowError(
                    /^.*doesn't support account deployment.*$/i
                )
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "deployContract_V07",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V07,
                        paymasterRpc
                    })
                })

                await expect(async () =>
                    smartClient.deployContract({
                        abi: [],
                        bytecode: "0xff66"
                    })
                ).rejects.toThrowError(
                    /^.*doesn't support account deployment.*$/i
                )
            }
        )
    }
)
