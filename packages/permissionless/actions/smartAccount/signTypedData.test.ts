import { getAddress, zeroAddress } from "viem"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { signTypedData } from "./signTypedData"

const typedData = {
    domain: {
        name: "Ether Mail",
        version: "1",
        chainId: 1,
        verifyingContract: getAddress(
            "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
        )
    },
    types: {
        Person: [
            { name: "name", type: "string" },
            { name: "wallet", type: "address" }
        ],
        Mail: [
            { name: "from", type: "Person" },
            { name: "to", type: "Person" },
            { name: "contents", type: "string" }
        ]
    },
    primaryType: "Mail" as const,
    message: {
        from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
        },
        to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
        },
        contents: "Hello, Bob!"
    }
}

describe.each(getCoreSmartAccounts())(
    "signTypedData $name",
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
                    signTypedData(smartClient, typedData)
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

                const signature = await signTypedData(smartClient, typedData)

                const publicClient = getPublicClient(anvilRpc)

                const isVerified = await publicClient.verifyTypedData({
                    ...typedData,
                    address: smartClient.account.address,
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
                    signTypedData(smartClient, typedData)
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

                const signature = await signTypedData(smartClient, typedData)

                const publicClient = getPublicClient(anvilRpc)

                if (name === "LightAccount 2.0.0") {
                    // LightAccount 2.0.0 doesn't support EIP-1271
                    return
                }

                if (name.includes("Safe 7579")) {
                    // Due to 7579 launchpad, we can't verify the signature before deploying the account.
                    await smartClient.sendTransaction({
                        calls: [{ to: zeroAddress, value: 0n }]
                    })
                }
                const isVerified = await publicClient.verifyTypedData({
                    ...typedData,
                    address: smartClient.account.address,
                    signature
                })

                expect(isVerified).toBeTruthy()
            }
        )
    }
)
