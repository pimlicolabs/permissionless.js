import { http } from "viem"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoClient
} from "../../permissionless-test/src/utils"
import { createPimlicoClient } from "./pimlico"

describe.each(getCoreSmartAccounts())(
    "createSmartAccountClient $name",
    ({ getSmartAccountClient, supportsEntryPointV07 }) => {
        testWithRpc.skipIf(!supportsEntryPointV07)(
            "creates client with expected smart account actions",
            async ({ rpc }) => {
                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                // Verify client has smart account actions
                expect(smartClient.sendTransaction).toBeDefined()
                expect(typeof smartClient.sendTransaction).toBe("function")
                expect(smartClient.signMessage).toBeDefined()
                expect(typeof smartClient.signMessage).toBe("function")
                expect(smartClient.signTypedData).toBeDefined()
                expect(typeof smartClient.signTypedData).toBe("function")
                expect(smartClient.writeContract).toBeDefined()
                expect(typeof smartClient.writeContract).toBe("function")
                expect(smartClient.sendCalls).toBeDefined()
                expect(typeof smartClient.sendCalls).toBe("function")
                expect(smartClient.getCallsStatus).toBeDefined()
                expect(typeof smartClient.getCallsStatus).toBe("function")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "creates client with bundler actions",
            async ({ rpc }) => {
                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                // Verify client has bundler actions
                expect(smartClient.sendUserOperation).toBeDefined()
                expect(typeof smartClient.sendUserOperation).toBe("function")
                expect(smartClient.estimateUserOperationGas).toBeDefined()
                expect(typeof smartClient.estimateUserOperationGas).toBe(
                    "function"
                )
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "client has account attached",
            async ({ rpc }) => {
                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                expect(smartClient.account).toBeDefined()
                expect(smartClient.account.address).toBeDefined()
                expect(smartClient.account.address.startsWith("0x")).toBe(true)
            }
        )
    }
)

describe("createPimlicoClient", () => {
    testWithRpc(
        "creates pimlico client with expected actions",
        async ({ rpc }) => {
            const pimlicoClient = createPimlicoClient({
                chain: foundry,
                transport: http(rpc.altoRpc)
            })

            // Verify client has pimlico actions
            expect(pimlicoClient.getUserOperationGasPrice).toBeDefined()
            expect(typeof pimlicoClient.getUserOperationGasPrice).toBe(
                "function"
            )
            expect(pimlicoClient.getUserOperationStatus).toBeDefined()
            expect(typeof pimlicoClient.getUserOperationStatus).toBe("function")
            expect(pimlicoClient.sendCompressedUserOperation).toBeDefined()
            expect(typeof pimlicoClient.sendCompressedUserOperation).toBe(
                "function"
            )
            expect(pimlicoClient.sponsorUserOperation).toBeDefined()
            expect(typeof pimlicoClient.sponsorUserOperation).toBe("function")
            expect(pimlicoClient.validateSponsorshipPolicies).toBeDefined()
            expect(typeof pimlicoClient.validateSponsorshipPolicies).toBe(
                "function"
            )
            expect(pimlicoClient.getTokenQuotes).toBeDefined()
            expect(typeof pimlicoClient.getTokenQuotes).toBe("function")
            expect(pimlicoClient.estimateErc20PaymasterCost).toBeDefined()
            expect(typeof pimlicoClient.estimateErc20PaymasterCost).toBe(
                "function"
            )
        }
    )

    testWithRpc(
        "creates pimlico client with bundler and paymaster actions",
        async ({ rpc }) => {
            const pimlicoClient = createPimlicoClient({
                chain: foundry,
                transport: http(rpc.altoRpc)
            })

            // Verify bundler actions
            expect(pimlicoClient.sendUserOperation).toBeDefined()
            expect(typeof pimlicoClient.sendUserOperation).toBe("function")

            // Verify paymaster actions
            expect(pimlicoClient.getPaymasterData).toBeDefined()
            expect(typeof pimlicoClient.getPaymasterData).toBe("function")
            expect(pimlicoClient.getPaymasterStubData).toBeDefined()
            expect(typeof pimlicoClient.getPaymasterStubData).toBe("function")
        }
    )

    testWithRpc("pimlico client with custom entry point", async ({ rpc }) => {
        const pimlicoClient = createPimlicoClient({
            chain: foundry,
            transport: http(rpc.altoRpc),
            entryPoint: {
                address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
                version: "0.6"
            }
        })

        expect(pimlicoClient.getUserOperationGasPrice).toBeDefined()
    })
})
