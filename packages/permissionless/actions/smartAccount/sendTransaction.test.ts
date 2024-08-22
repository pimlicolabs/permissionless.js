import { zeroAddress } from "viem"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { sendTransaction } from "./sendTransaction"

describe.each(getCoreSmartAccounts())(
    "sendTransaction $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07
    }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "sendTransaction_v06",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.6"
                    },
                    ...rpc
                })

                const transactionHash = await sendTransaction(smartClient, {
                    chain: foundry,
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                })

                expect(transactionHash).toBeTruthy()

                const publicClient = getPublicClient(anvilRpc)

                const receipt = await publicClient.getTransactionReceipt({
                    hash: transactionHash
                })

                expect(receipt).toBeTruthy()
                expect(receipt.transactionHash).toBe(transactionHash)
                expect(receipt.status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "sendTransaction_v07",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                const transactionHash = await sendTransaction(smartClient, {
                    chain: foundry,
                    to: zeroAddress,
                    data: "0x",
                    value: 0n
                })

                expect(transactionHash).toBeTruthy()

                const publicClient = getPublicClient(anvilRpc)

                const receipt = await publicClient.getTransactionReceipt({
                    hash: transactionHash
                })

                expect(receipt).toBeTruthy()
                expect(receipt.transactionHash).toBe(transactionHash)
                expect(receipt.status).toBe("success")
            }
        )
    }
)
