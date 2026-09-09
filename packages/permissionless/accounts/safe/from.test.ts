import { Account, type Client } from "viem"
import { EntryPoint } from "viem/erc4337"
import { Abi, AbiFunction, Address, Solidity } from "viem/utils"
import { describe, expect } from "vitest"
import { erc20Address } from "../../../mock-paymaster/helpers/erc20-utils"
import {
    anvilAccount,
    loadCounterfactualAddressFixture
} from "../../../permissionless-test/src/fixtures/counterfactualAddresses"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { SafeEntryPointVersionUnsupportedError } from "../../errors/safe"
import { decodeNonce } from "../../utils/decodeNonce"
import * as SafeSmartAccount from "./index"

const erc20Abi = Abi.from([
    "function approve(address spender, uint256 amount) returns (bool)"
])

const approve = (amount: bigint) => ({
    to: Address.checksum(erc20Address),
    value: 0n,
    data: AbiFunction.encodeData(erc20Abi, "approve", [
        "0x0000000000000000000000000000000000001337",
        amount
    ])
})

const erc7579 = {
    safe4337ModuleAddress:
        "0x7579EE8307284F293B1927136486880611F20002" as const,
    erc7579LaunchpadAddress:
        "0x7579011aB74c46090561ea277Ba79D510c6C00ff" as const,
    attesters: ["0x000000333034E9f539ce08819E12c1b8Cb29084d" as const],
    attestersThreshold: 1
}

const pinnedDefault = loadCounterfactualAddressFixture("safe").find(
    ({ params }) =>
        params.entryPoint === "0.7" &&
        params.version === "1.4.1" &&
        params.owners.length === 1 &&
        params.saltNonce === "0" &&
        params.threshold === undefined &&
        params.useMultiSendForSetup === undefined &&
        params.erc7579 === undefined &&
        params.setupTransactions === undefined
)

describe("SafeSmartAccount.from", () => {
    testWithRpc(
        "defaults to EntryPoint 0.7 and Safe 1.4.1 (frozen; same address as the explicit 0.x parameters)",
        async ({ rpc }) => {
            const client: Client.Client = getPublicClient(rpc.anvilRpc)
            const owners = [anvilAccount("anvil0")]

            const [byDefault, explicit] = await Promise.all([
                SafeSmartAccount.from({ client, owners }),
                SafeSmartAccount.from({
                    client,
                    owners,
                    version: "1.4.1",
                    entryPoint: {
                        address: EntryPoint.addressV07,
                        version: "0.7"
                    }
                })
            ])

            expect(byDefault.entryPoint.version).toBe("0.7")
            expect(byDefault.entryPoint.address).toBe(EntryPoint.addressV07)
            expect(byDefault.address).toBe(explicit.address)
            expect(await byDefault.getFactoryArgs()).toStrictEqual(
                await explicit.getFactoryArgs()
            )
            expect(byDefault.address).toBe(pinnedDefault?.address)
        }
    )

    testWithRpc(
        "entryPoint shorthand '0.6' equals the { address, version } form",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owners = [Account.random()]

            const [shorthand, explicit] = await Promise.all([
                SafeSmartAccount.from({ client, owners, entryPoint: "0.6" }),
                SafeSmartAccount.from({
                    client,
                    owners,
                    entryPoint: {
                        address: EntryPoint.addressV06,
                        version: "0.6"
                    }
                })
            ])

            expect(shorthand.entryPoint.version).toBe("0.6")
            expect(shorthand.entryPoint.address).toBe(EntryPoint.addressV06)
            expect(shorthand.address).toBe(explicit.address)
        }
    )

    testWithRpc(
        "nonce key: per-call key, then constructor nonceKey, then 0n (exact for a full-width uint192 key)",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owners = [Account.random()]
            const wideKey = 2n ** 160n + 1n

            const [plain, keyed] = await Promise.all([
                SafeSmartAccount.from({ client, owners }),
                SafeSmartAccount.from({ client, owners, nonceKey: wideKey })
            ])

            expect(decodeNonce(await plain.getNonce()).key).toBe(0n)
            expect(decodeNonce(await keyed.getNonce()).key).toBe(wideKey)
            expect(decodeNonce(await keyed.getNonce({ key: 7n })).key).toBe(7n)
            expect(
                decodeNonce(await plain.getNonce({ key: Solidity.maxUint192 }))
                    .key
            ).toBe(Solidity.maxUint192)

            const smartAccountClient = getBundlerClient({
                account: keyed,
                entryPoint: { version: "0.7" },
                ...rpc
            })
            const userOperation =
                await smartAccountClient.userOperation.prepare({
                    calls: [approve(1n)]
                })
            expect(decodeNonce(userOperation.nonce).key).toBe(wideKey)
        }
    )

    for (const entryPointVersion of ["0.6", "0.7"] as const) {
        testWithRpc(
            `a deployed 3-of-3 Safe on EntryPoint ${entryPointVersion} keeps a verificationGasLimit floor (bundlers estimate against the stub signature, which Safe rejects after one owner)`,
            async ({ rpc }) => {
                const client = getPublicClient(rpc.anvilRpc)
                const account = await SafeSmartAccount.from({
                    client,
                    owners: [
                        Account.random(),
                        Account.random(),
                        Account.random()
                    ],
                    entryPoint: entryPointVersion
                })
                const smartAccountClient = getBundlerClient({
                    account,
                    entryPoint: { version: entryPointVersion },
                    ...rpc
                })
                const calls = [approve(1n)]

                const deployed =
                    await smartAccountClient.userOperation.waitForReceipt({
                        hash: await smartAccountClient.userOperation.send({
                            calls
                        })
                    })
                expect(deployed.success).toBe(true)

                const second = await smartAccountClient.userOperation.prepare({
                    calls
                })
                expect(second.verificationGasLimit).toBe(125_000n)
                const receipt =
                    await smartAccountClient.userOperation.waitForReceipt({
                        hash: await smartAccountClient.userOperation.send({
                            calls
                        })
                    })
                expect(receipt.success).toBe(true)
            }
        )
    }

    testWithRpc(
        "throws SafeEntryPointVersionUnsupportedError for Safe 1.5.0 on EntryPoint 0.6",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)

            await expect(
                SafeSmartAccount.from({
                    client,
                    owners: [Account.random()],
                    version: "1.5.0",
                    entryPoint: "0.6"
                })
            ).rejects.toBeInstanceOf(SafeEntryPointVersionUnsupportedError)
        }
    )

    testWithRpc(
        "decodeCalls inverts encodeCalls for single, batched and ERC-7579 calls",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = Account.random()
            const single = approve(1n)
            const calls = [
                single,
                { ...approve(2n), value: 1n },
                { to: owner.address, value: 2n, data: "0x" as const }
            ]

            const [account, erc7579Account] = await Promise.all([
                SafeSmartAccount.from({ client, owners: [owner] }),
                SafeSmartAccount.from({ client, owners: [owner], ...erc7579 })
            ])

            expect(
                await account.decodeCalls(await account.encodeCalls([single]))
            ).toEqual([single])
            expect(
                await account.decodeCalls(await account.encodeCalls(calls))
            ).toEqual(calls)
            expect(
                await erc7579Account.decodeCalls(
                    await erc7579Account.encodeCalls([single])
                )
            ).toEqual([single])
            expect(
                await erc7579Account.decodeCalls(
                    await erc7579Account.encodeCalls(calls)
                )
            ).toEqual(calls)
        }
    )
})
