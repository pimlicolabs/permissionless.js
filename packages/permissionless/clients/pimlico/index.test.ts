import { Actions, custom, http } from "viem"
import { anvil } from "viem/chains"
import { EntryPoint } from "viem/erc4337"
import { Value } from "viem/utils"
import { describe, expect } from "vitest"
import { getSimpleClient } from "../../../permissionless-test/src/accounts/simple"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getAnvilWalletClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import * as SmartAccountClient from "../smartAccount/index"
import * as PimlicoClient from "./index"

const zeroAddress = "0x0000000000000000000000000000000000000000"
const calls = [{ to: zeroAddress, value: 0n, data: "0x" }] as const
const fees = { maxFeePerGas: 10n ** 9n, maxPriorityFeePerGas: 10n ** 9n }

const recording = (url: string, methods: string[]) => {
    const transport = http(url).setup({ chain: anvil })
    return custom({
        async request({ method, params }) {
            methods.push(method)
            return transport.request({ method, params })
        }
    })
}

describe("PimlicoClient", () => {
    testWithRpc(
        "userOperation.prepare on the client itself is not sponsored",
        async ({ rpc }) => {
            const account = await getSimpleClient({
                ...rpc,
                entryPoint: { version: "0.7" }
            })
            const publicClient = getPublicClient(rpc.anvilRpc)
            await Actions.transaction.waitForReceipt(publicClient, {
                hash: await Actions.transaction.send(
                    getAnvilWalletClient({ addressIndex: 0, ...rpc }),
                    { to: account.address, value: Value.fromEther("1") }
                )
            })
            const methods: string[] = []
            const pimlicoClient = PimlicoClient.create({
                chain: anvil,
                transport: recording(rpc.altoRpc, methods),
                entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
            })

            const prepared = await pimlicoClient.userOperation.prepare({
                account,
                calls,
                ...fees
            })

            expect(prepared.paymaster).toBeUndefined()
            expect(methods).toContain("eth_estimateUserOperationGas")
            expect(methods.filter((m) => m.startsWith("pm_"))).toEqual([])
            expect(pimlicoClient.paymaster.getData).toBeTypeOf("function")
        }
    )

    testWithRpc(
        "paymaster: pimlicoClient sponsors a SmartAccountClient",
        async ({ rpc }) => {
            const account = await getSimpleClient({
                ...rpc,
                entryPoint: { version: "0.7" }
            })
            const methods: string[] = []
            const paymaster = PimlicoClient.create({
                chain: anvil,
                transport: recording(rpc.paymasterRpc, methods),
                entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
            })
            const client = SmartAccountClient.create({
                client: getPublicClient(rpc.anvilRpc),
                chain: anvil,
                account,
                paymaster,
                bundlerTransport: http(rpc.altoRpc)
            })

            const prepared = await client.userOperation.prepare({
                calls,
                ...fees
            })

            expect(prepared.paymaster).toBeDefined()
            expect(methods).toEqual(
                expect.arrayContaining([
                    "pm_getPaymasterStubData",
                    "pm_getPaymasterData"
                ])
            )
        }
    )
})
