import { zeroAddress } from "viem"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { signMessage } from "./signMessage"

describe.each(getCoreSmartAccounts())(
    "signMessage $name",
    ({
        getSmartAccountClient,
        isEip1271Compliant,
        supportsEntryPointV06,
        supportsEntryPointV07,
        name
    }) => {
        testWithRpc.skipIf(isEip1271Compliant || !supportsEntryPointV06)(
            "not isEip1271Compliant_v06",
            async ({ rpc }) => {
                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.6"
                    },
                    ...rpc
                })

                await expect(async () =>
                    signMessage(smartClient, {
                        message: "slowly and steadily burning the private keys"
                    })
                ).rejects.toThrow()
            }
        )

        testWithRpc.skipIf(!isEip1271Compliant || !supportsEntryPointV06)(
            "isEip1271Compliant_v06",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.6"
                    },
                    ...rpc
                })

                const signature = await signMessage(smartClient, {
                    message: "slowly and steadily burning the private keys"
                })

                const publicClient = getPublicClient(anvilRpc)

                const isVerified = await publicClient.verifyMessage({
                    address: smartClient.account.address,
                    message: "slowly and steadily burning the private keys",
                    signature
                })

                expect(isVerified).toBeTruthy()
            }
        )

        testWithRpc.skipIf(isEip1271Compliant || !supportsEntryPointV07)(
            "not isEip1271Compliant_v07",
            async ({ rpc }) => {
                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                await expect(async () =>
                    signMessage(smartClient, {
                        message: "slowly and steadily burning the private keys"
                    })
                ).rejects.toThrow()
            }
        )

        testWithRpc.skipIf(!isEip1271Compliant || !supportsEntryPointV07)(
            "isEip1271Compliant_v07",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                const signature = await signMessage(smartClient, {
                    message: "slowly and steadily burning the private keys"
                })

                const publicClient = getPublicClient(anvilRpc)

                if (name === "Safe 7579" || name === "LightAccount 2.0.0") {
                    // Due to 7579 launchpad, we can't verify the signature as of now.
                    // Awaiting for the fix
                    return
                }

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
