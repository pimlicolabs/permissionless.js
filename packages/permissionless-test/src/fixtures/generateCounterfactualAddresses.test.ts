import { execFileSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import type { Client, LocalAccount } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { expect } from "vitest"
import { toEtherspotSmartAccount } from "../../../permissionless/accounts/etherspot/toEtherspotSmartAccount"
import { to7702KernelSmartAccount } from "../../../permissionless/accounts/kernel/to7702KernelSmartAccount"
import { toEcdsaKernelSmartAccount } from "../../../permissionless/accounts/kernel/toEcdsaKernelSmartAccount"
import {
    type KernelVersion,
    type ToKernelSmartAccountParameters,
    toKernelSmartAccount
} from "../../../permissionless/accounts/kernel/toKernelSmartAccount"
import { toLightSmartAccount } from "../../../permissionless/accounts/light/toLightSmartAccount"
import { toNexusSmartAccount } from "../../../permissionless/accounts/nexus/toNexusSmartAccount"
import { toSafeSmartAccount } from "../../../permissionless/accounts/safe/toSafeSmartAccount"
import { to7702SimpleSmartAccount } from "../../../permissionless/accounts/simple/to7702SimpleSmartAccount"
import { toSimpleSmartAccount } from "../../../permissionless/accounts/simple/toSimpleSmartAccount"
import { toThirdwebSmartAccount } from "../../../permissionless/accounts/thirdweb/toThirdwebSmartAccount"
import { toTrustSmartAccount } from "../../../permissionless/accounts/trust/toTrustSmartAccount"
import { testWithRpc } from "../testWithRpc"
import { getPublicClient } from "../utils"
import {
    type CounterfactualAddressAccount,
    type CounterfactualAddressEntry,
    type CounterfactualAddressParams,
    anvilAccount,
    counterfactualAddressFixturePath,
    snapshotCounterfactualAddress,
    toEntryPoint
} from "./counterfactualAddresses"

const owner = "anvil0"
const indexes = ["0", "1"] as const

const record = async <account extends CounterfactualAddressAccount>(
    account: account,
    params: CounterfactualAddressParams[account],
    build: () => Promise<SmartAccount>
): Promise<CounterfactualAddressEntry<account>> => ({
    account,
    params,
    ...(await snapshotCounterfactualAddress(await build()))
})

const simple = async (client: Client) => {
    const entries: CounterfactualAddressEntry<"simple">[] = []
    for (const entryPoint of ["0.6", "0.7", "0.8"] as const) {
        for (const index of indexes) {
            entries.push(
                await record(
                    "simple",
                    { via: "toSimpleSmartAccount", entryPoint, owner, index },
                    () =>
                        toSimpleSmartAccount({
                            client,
                            entryPoint: toEntryPoint(entryPoint),
                            owner: anvilAccount(owner),
                            index: BigInt(index)
                        })
                )
            )
        }
    }
    entries.push(
        await record(
            "simple",
            { via: "to7702SimpleSmartAccount", entryPoint: "0.8", owner },
            () =>
                to7702SimpleSmartAccount({
                    client,
                    entryPoint: toEntryPoint("0.8"),
                    owner: anvilAccount(owner)
                })
        )
    )
    return entries
}

const safeErc7579: NonNullable<CounterfactualAddressParams["safe"]["erc7579"]> =
    {
        safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002",
        erc7579LaunchpadAddress: "0x7579011aB74c46090561ea277Ba79D510c6C00ff",
        attesters: ["0x000000333034E9f539ce08819E12c1b8Cb29084d"],
        attestersThreshold: 1
    }

const safeSetupTransactions: NonNullable<
    CounterfactualAddressParams["safe"]["setupTransactions"]
> = [
    {
        to: "0x000000000000000000000000000000000000dEaD",
        data: "0xdeadbeef",
        value: "0"
    }
]

const safe = async (client: Client) => {
    const entries: CounterfactualAddressEntry<"safe">[] = []
    for (const [entryPoint, version] of [
        ["0.6", "1.4.1"],
        ["0.7", "1.4.1"],
        ["0.7", "1.5.0"]
    ] as const) {
        for (const owners of [["anvil0"], ["anvil0", "anvil1"]] as const) {
            for (const saltNonce of indexes) {
                entries.push(
                    await record(
                        "safe",
                        { entryPoint, version, owners: [...owners], saltNonce },
                        () =>
                            toSafeSmartAccount({
                                client,
                                entryPoint: toEntryPoint(entryPoint),
                                version,
                                owners: owners.map(anvilAccount),
                                saltNonce: BigInt(saltNonce)
                            })
                    )
                )
            }
        }
    }
    const base = {
        entryPoint: "0.7",
        version: "1.4.1",
        owners: [owner],
        saltNonce: "0"
    } satisfies CounterfactualAddressParams["safe"]
    const buildBase = () => ({
        client,
        entryPoint: toEntryPoint(base.entryPoint),
        version: base.version,
        owners: [anvilAccount(owner)],
        saltNonce: BigInt(base.saltNonce)
    })
    entries.push(
        await record("safe", { ...base, erc7579: safeErc7579 }, () =>
            toSafeSmartAccount({ ...buildBase(), ...safeErc7579 })
        )
    )
    entries.push(
        await record(
            "safe",
            { ...base, setupTransactions: safeSetupTransactions },
            () =>
                toSafeSmartAccount({
                    ...buildBase(),
                    setupTransactions: safeSetupTransactions.map((tx) => ({
                        ...tx,
                        value: BigInt(tx.value)
                    }))
                })
        )
    )
    entries.push(
        await record("safe", { ...base, useMultiSendForSetup: false }, () =>
            toSafeSmartAccount({ ...buildBase(), useMultiSendForSetup: false })
        )
    )
    entries.push(
        await record(
            "safe",
            { ...base, owners: ["anvil0", "anvil1"], threshold: "1" },
            () =>
                toSafeSmartAccount({
                    ...buildBase(),
                    owners: [anvilAccount("anvil0"), anvilAccount("anvil1")],
                    threshold: 1n
                })
        )
    )
    return entries
}

const buildKernel = <
    entryPointVersion extends "0.6" | "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>
>(
    via: "toKernelSmartAccount" | "toEcdsaKernelSmartAccount",
    parameters: ToKernelSmartAccountParameters<
        entryPointVersion,
        kernelVersion,
        LocalAccount
    >
) =>
    via === "toEcdsaKernelSmartAccount"
        ? toEcdsaKernelSmartAccount(parameters)
        : toKernelSmartAccount(parameters)

const kernel = async (client: Client) => {
    const entries: CounterfactualAddressEntry<"kernel">[] = []
    for (const via of [
        "toKernelSmartAccount",
        "toEcdsaKernelSmartAccount"
    ] as const) {
        for (const version of ["0.2.1", "0.2.2", "0.2.3", "0.2.4"] as const) {
            for (const index of indexes) {
                entries.push(
                    await record(
                        "kernel",
                        {
                            via,
                            entryPoint: "0.6",
                            version,
                            owners: [owner],
                            index
                        },
                        () =>
                            buildKernel(via, {
                                client,
                                entryPoint: toEntryPoint("0.6"),
                                version,
                                owners: [anvilAccount(owner)],
                                index: BigInt(index)
                            })
                    )
                )
            }
        }
        for (const version of [
            "0.3.0-beta",
            "0.3.1",
            "0.3.2",
            "0.3.3"
        ] as const) {
            for (const useMetaFactory of [true, false]) {
                for (const index of indexes) {
                    entries.push(
                        await record(
                            "kernel",
                            {
                                via,
                                entryPoint: "0.7",
                                version,
                                owners: [owner],
                                index,
                                useMetaFactory
                            },
                            () =>
                                buildKernel(via, {
                                    client,
                                    entryPoint: toEntryPoint("0.7"),
                                    version,
                                    owners: [anvilAccount(owner)],
                                    index: BigInt(index),
                                    useMetaFactory
                                })
                        )
                    )
                }
            }
        }
    }
    entries.push(
        await record(
            "kernel",
            { via: "to7702KernelSmartAccount", entryPoint: "0.7", owner },
            () =>
                to7702KernelSmartAccount({
                    client,
                    entryPoint: toEntryPoint("0.7"),
                    owner: anvilAccount(owner)
                })
        )
    )
    return entries
}

const nexus = async (client: Client) => {
    const entries: CounterfactualAddressEntry<"nexus">[] = []
    for (const index of indexes) {
        entries.push(
            await record(
                "nexus",
                { entryPoint: "0.7", version: "1.0.0", owners: [owner], index },
                () =>
                    toNexusSmartAccount({
                        client,
                        entryPoint: toEntryPoint("0.7"),
                        version: "1.0.0",
                        owners: [anvilAccount(owner)],
                        index: BigInt(index)
                    })
            )
        )
    }
    const attesters = [
        "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
        "0x000000333034E9f539ce08819E12c1b8Cb29084d"
    ] as const
    entries.push(
        await record(
            "nexus",
            {
                entryPoint: "0.7",
                version: "1.0.0",
                owners: [owner],
                index: "0",
                attesters: [...attesters],
                threshold: 1
            },
            () =>
                toNexusSmartAccount({
                    client,
                    entryPoint: toEntryPoint("0.7"),
                    version: "1.0.0",
                    owners: [anvilAccount(owner)],
                    index: 0n,
                    attesters: [...attesters],
                    threshold: 1
                })
        )
    )
    return entries
}

const light = async (client: Client) => {
    const entries: CounterfactualAddressEntry<"light">[] = []
    for (const [entryPoint, version] of [
        ["0.6", "1.1.0"],
        ["0.7", "2.0.0"]
    ] as const) {
        for (const index of indexes) {
            entries.push(
                await record(
                    "light",
                    { entryPoint, version, owner, index },
                    () =>
                        toLightSmartAccount({
                            client,
                            entryPoint: toEntryPoint(entryPoint),
                            version,
                            owner: anvilAccount(owner),
                            index: BigInt(index)
                        })
                )
            )
        }
    }
    return entries
}

const thirdweb = async (client: Client) => {
    const entries: CounterfactualAddressEntry<"thirdweb">[] = []
    for (const entryPoint of ["0.6", "0.7"] as const) {
        for (const salt of [undefined, "1"]) {
            entries.push(
                await record(
                    "thirdweb",
                    { entryPoint, version: "1.5.20", owner, salt },
                    () =>
                        toThirdwebSmartAccount({
                            client,
                            entryPoint: toEntryPoint(entryPoint),
                            version: "1.5.20",
                            owner: anvilAccount(owner),
                            salt
                        })
                )
            )
        }
    }
    return entries
}

const trust = async (client: Client) => {
    const entries: CounterfactualAddressEntry<"trust">[] = []
    for (const index of indexes) {
        entries.push(
            await record("trust", { entryPoint: "0.6", owner, index }, () =>
                toTrustSmartAccount({
                    client,
                    entryPoint: toEntryPoint("0.6"),
                    owner: anvilAccount(owner),
                    index: BigInt(index)
                })
            )
        )
    }
    return entries
}

const etherspot = async (client: Client) => {
    const entries: CounterfactualAddressEntry<"etherspot">[] = []
    for (const index of indexes) {
        entries.push(
            await record(
                "etherspot",
                { entryPoint: "0.7", owners: [owner], index },
                () =>
                    toEtherspotSmartAccount({
                        client,
                        entryPoint: toEntryPoint("0.7"),
                        owners: [anvilAccount(owner)],
                        index: BigInt(index)
                    })
            )
        )
    }
    return entries
}

const sortKey = (entry: CounterfactualAddressEntry) =>
    `${entry.account} ${JSON.stringify(entry.params)}`

testWithRpc.skipIf(process.env.GENERATE_ADDRESS_FIXTURE !== "1")(
    "writes counterfactualAddresses.0x.json",
    { timeout: 300_000 },
    async ({ rpc }) => {
        const client = getPublicClient(rpc.anvilRpc)
        const entries: CounterfactualAddressEntry[] = []
        for (const generate of [
            simple,
            safe,
            kernel,
            nexus,
            light,
            thirdweb,
            trust,
            etherspot
        ]) {
            entries.push(...(await generate(client)))
        }
        entries.sort((a, b) => {
            const [x, y] = [sortKey(a), sortKey(b)]
            return x < y ? -1 : x > y ? 1 : 0
        })
        writeFileSync(
            counterfactualAddressFixturePath,
            `${JSON.stringify(entries, null, 4)}\n`
        )
        execFileSync(
            fileURLToPath(
                new URL("../../../../node_modules/.bin/biome", import.meta.url)
            ),
            ["format", "--write", counterfactualAddressFixturePath]
        )
        const counts: Record<string, number> = {}
        for (const { account } of entries) {
            counts[account] = (counts[account] ?? 0) + 1
        }
        console.log(counterfactualAddressFixturePath, counts)
        expect(new Set(entries.map(sortKey)).size).toBe(entries.length)
    }
)
