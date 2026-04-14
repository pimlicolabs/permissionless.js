import { describe, expect } from "vitest"
import { testWithRpc } from "../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../permissionless-test/src/utils"
import { isSmartAccountDeployed } from "./isSmartAccountDeployed"

describe.each(getCoreSmartAccounts())(
    "isSmartAccountDeployed $name",
    ({ getSmartAccountClient, supportsEntryPointV07, isEip7702Compliant }) => {
        testWithRpc.skipIf(!supportsEntryPointV07)(
            "returns false for undeployed account",
            async ({ rpc }) => {
                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                const publicClient = getPublicClient(rpc.anvilRpc)

                const deployed = await isSmartAccountDeployed(
                    publicClient,
                    smartClient.account.address
                )

                expect(deployed).toBe(false)
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07 || isEip7702Compliant)(
            "returns true after account is deployed via transaction",
            async ({ rpc }) => {
                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                const publicClient = getPublicClient(rpc.anvilRpc)

                // Send a transaction to trigger account deployment
                await smartClient.sendTransaction({
                    to: "0x0000000000000000000000000000000000000000",
                    data: "0x",
                    value: 0n
                })

                const deployed = await isSmartAccountDeployed(
                    publicClient,
                    smartClient.account.address
                )

                expect(deployed).toBe(true)
            }
        )
    }
)

describe("isSmartAccountDeployed", () => {
    testWithRpc("returns false for random EOA address", async ({ rpc }) => {
        const publicClient = getPublicClient(rpc.anvilRpc)

        const deployed = await isSmartAccountDeployed(
            publicClient,
            "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
        )

        expect(deployed).toBe(false)
    })
})
