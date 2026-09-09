import { Account } from "viem"
import { EntryPoint } from "viem/erc4337"
import { describe, expect } from "vitest"
import { getLightAccountClient } from "../../../permissionless-test/src/accounts/light"
import {
    anvilAccount,
    expectCounterfactualAddress,
    loadCounterfactualAddressFixture
} from "../../../permissionless-test/src/fixtures/counterfactualAddresses"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { EmptyCallsError } from "../../errors/account"
import { LightSmartAccountUnsupportedVersionError } from "../../errors/light"
import * as LightSmartAccount from "./index"

const zeroAddress = "0x0000000000000000000000000000000000000000"

const fixture = (entryPoint: "0.6" | "0.7") => {
    const entry = loadCounterfactualAddressFixture("light").find(
        ({ params }) =>
            params.entryPoint === entryPoint &&
            params.owner === "anvil0" &&
            params.index === "0"
    )
    if (!entry) throw new Error(`no light fixture for EntryPoint ${entryPoint}`)
    return entry
}

describe("LightSmartAccount.from", () => {
    testWithRpc(
        "defaults to EntryPoint 0.7 and version 2.0.0",
        async ({ rpc }) => {
            const account = await LightSmartAccount.from({
                client: getPublicClient(rpc.anvilRpc),
                owner: anvilAccount("anvil0")
            })
            expect(account.entryPoint.version).toBe("0.7")
            expect(account.entryPoint.address).toBe(EntryPoint.addressV07)
            await expectCounterfactualAddress(account, fixture("0.7"))
        }
    )

    testWithRpc(
        "derives version 1.1.0 from EntryPoint 0.6",
        async ({ rpc }) => {
            const account = await LightSmartAccount.from({
                client: getPublicClient(rpc.anvilRpc),
                entryPoint: "0.6",
                owner: anvilAccount("anvil0")
            })
            expect(account.entryPoint.version).toBe("0.6")
            expect(account.entryPoint.address).toBe(EntryPoint.addressV06)
            await expectCounterfactualAddress(account, fixture("0.6"))
        }
    )

    testWithRpc(
        "rejects a version the EntryPoint does not support",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            await expect(
                LightSmartAccount.from({
                    client,
                    entryPoint: "0.6",
                    owner: Account.random(),
                    version: "2.0.0" as never
                })
            ).rejects.toBeInstanceOf(LightSmartAccountUnsupportedVersionError)
            await expect(
                LightSmartAccount.from({
                    client,
                    owner: Account.random(),
                    version: "1.1.0" as never
                })
            ).rejects.toBeInstanceOf(LightSmartAccountUnsupportedVersionError)
        }
    )

    testWithRpc(
        "nonce key: per-call, then nonceKey, then 0",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = Account.random()
            const account = await LightSmartAccount.from({
                client,
                owner,
                nonceKey: 5n
            })
            expect(await account.getNonce()).toBe(5n << 64n)
            expect(await account.getNonce({ key: 7n })).toBe(7n << 64n)
            const plain = await LightSmartAccount.from({ client, owner })
            expect(await plain.getNonce()).toBe(0n)
            expect(await plain.getNonce({ key: 7n })).toBe(7n << 64n)
        }
    )

    testWithRpc("encodeCalls and decodeCalls round-trip", async ({ rpc }) => {
        const account = await LightSmartAccount.from({
            client: getPublicClient(rpc.anvilRpc),
            owner: Account.random()
        })
        const single = [
            { to: zeroAddress, value: 1n, data: "0xdeadbeef" }
        ] as const
        expect(
            await account.decodeCalls?.(await account.encodeCalls(single))
        ).toEqual(single)
        const batch = [
            { to: zeroAddress, value: 1n, data: "0xdeadbeef" },
            { to: zeroAddress }
        ] as const
        expect(
            await account.decodeCalls?.(await account.encodeCalls(batch))
        ).toEqual([
            { to: zeroAddress, value: 1n, data: "0xdeadbeef" },
            { to: zeroAddress, value: 0n, data: "0x" }
        ])
        expect(() => account.encodeCalls([])).toThrow(EmptyCallsError)
    })

    for (const entryPoint of ["0.6", "0.7"] as const) {
        testWithRpc(
            `sends user operations on EntryPoint ${entryPoint}`,
            async ({ rpc }) => {
                const account = await getLightAccountClient({
                    entryPoint: { version: entryPoint },
                    ...rpc
                })
                const client = getBundlerClient({
                    account,
                    entryPoint: { version: entryPoint },
                    ...rpc
                })
                const publicClient = getPublicClient(rpc.anvilRpc)
                for (const _ of [0, 1]) {
                    const hash = await client.sendTransaction({
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    })
                    const receipt = await publicClient.transaction.getReceipt({
                        hash
                    })
                    expect(receipt.status).toBe("success")
                }
                expect(await account.isDeployed()).toBe(true)
            }
        )
    }

    testWithRpc(
        "signMessage verifies through ERC-1271 on 1.1.0",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const account = await LightSmartAccount.from({
                client,
                entryPoint: "0.6",
                owner: Account.random()
            })
            const message = "slowly and steadily burning the private keys"
            const signature = await account.signMessage({ message })
            expect(
                await client.verifyMessage({
                    address: account.address,
                    message,
                    signature
                })
            ).toBe(true)
        }
    )
})
