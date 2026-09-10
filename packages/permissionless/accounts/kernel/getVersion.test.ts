import { Account } from "viem"
import { EntryPoint } from "viem/erc4337"
import { describe, expect } from "vitest"
import { getKernelClient } from "../../../permissionless-test/src/accounts/kernel"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { InvalidKernelAccountError } from "../../errors/kernel"
import * as KernelSmartAccount from "./index"

const zeroAddress = "0x0000000000000000000000000000000000000000"

describe("KernelSmartAccount.getVersion", () => {
    testWithRpc(
        "returns null when the address has no code",
        async ({ rpc }) => {
            expect(
                await KernelSmartAccount.getVersion(
                    getPublicClient(rpc.anvilRpc),
                    {
                        address: Account.random().address
                    }
                )
            ).toBeNull()
        }
    )

    testWithRpc("throws when the contract is not a Kernel", async ({ rpc }) => {
        await expect(
            KernelSmartAccount.getVersion(getPublicClient(rpc.anvilRpc), {
                address: EntryPoint.addressV07
            })
        ).rejects.toBeInstanceOf(InvalidKernelAccountError)
    })

    for (const [entryPoint, version] of [
        ["0.6", "0.2.1"],
        ["0.6", "0.2.2"],
        ["0.6", "0.2.3"],
        ["0.6", "0.2.4"],
        ["0.7", "0.3.0-beta"],
        ["0.7", "0.3.1"],
        ["0.7", "0.3.2"],
        ["0.7", "0.3.3"]
    ] as const) {
        testWithRpc(
            `reads ${version} from a deployed account`,
            async ({ rpc }) => {
                const account = await getKernelClient({
                    entryPoint: { version: entryPoint },
                    version,
                    ...rpc
                })
                const publicClient = getPublicClient(rpc.anvilRpc)
                expect(
                    await KernelSmartAccount.getVersion(publicClient, {
                        address: account.address
                    })
                ).toBeNull()
                await getBundlerClient({
                    account,
                    entryPoint: { version: entryPoint },
                    ...rpc
                }).sendTransaction({ to: zeroAddress, value: 0n, data: "0x" })
                expect(
                    await KernelSmartAccount.getVersion(publicClient, {
                        address: account.address
                    })
                ).toBe(version)
            }
        )
    }
})
