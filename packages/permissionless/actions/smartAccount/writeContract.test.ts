import { type Chain, type Client, type Transport, getAddress } from "viem"
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
                    signTypedData(
                        smartClient as Client<
                            Transport,
                            Chain,
                            SmartAccount<EntryPoint>
                        >,
                        typedData
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

                const signature = await signTypedData(
                    smartClient as Client<
                        Transport,
                        Chain,
                        SmartAccount<EntryPoint>
                    >,
                    typedData
                )

                const publicClient = getPublicClient(anvilRpc)

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
