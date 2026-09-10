import type { Client } from "viem"
import { describe } from "vitest"
import {
    anvilAccount,
    type CounterfactualAddressParams,
    describeParams,
    expectCounterfactualAddress,
    loadCounterfactualAddressFixture,
    toEntryPoint
} from "../../../permissionless-test/src/fixtures/counterfactualAddresses"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getPublicClient } from "../../../permissionless-test/src/utils"
import * as TrustSmartAccount from "./index.js"

const buildAccount = (
    client: Client.Client,
    params: CounterfactualAddressParams["trust"]
) =>
    TrustSmartAccount.from({
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        owner: anvilAccount(params.owner),
        index: BigInt(params.index)
    })

describe("TrustSmartAccount counterfactual addresses (0.x oracle)", () => {
    const entries = loadCounterfactualAddressFixture("trust")

    for (const entry of entries) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }

    testWithRpc("entryPoint defaults to 0.6", async ({ rpc }) => {
        const [entry] = entries
        if (!entry) throw new Error("no trust fixture entry")
        await expectCounterfactualAddress(
            await TrustSmartAccount.from({
                client: getPublicClient(rpc.anvilRpc),
                owner: anvilAccount(entry.params.owner),
                index: BigInt(entry.params.index)
            }),
            entry
        )
    })
})
