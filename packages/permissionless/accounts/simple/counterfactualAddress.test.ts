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
import * as SimpleSmartAccount from "./index.js"

const buildAccount = (
    client: Client.Client,
    params: CounterfactualAddressParams["simple"]
) => {
    if (params.via === "to7702SimpleSmartAccount") {
        return SimpleSmartAccount.from({
            client,
            entryPoint: toEntryPoint(params.entryPoint),
            owner: anvilAccount(params.owner),
            eip7702: true
        })
    }
    return SimpleSmartAccount.from({
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        owner: anvilAccount(params.owner),
        index: BigInt(params.index)
    })
}

describe("SimpleSmartAccount counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("simple")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }
})

describe("SimpleSmartAccount 1.0 defaults", () => {
    const explicit08 = loadCounterfactualAddressFixture("simple").filter(
        ({ params }) =>
            params.via === "toSimpleSmartAccount" && params.entryPoint === "0.8"
    )

    for (const entry of explicit08) {
        if (entry.params.via !== "toSimpleSmartAccount") continue
        const { owner, index } = entry.params
        testWithRpc(
            `default entryPoint is 0.8 (${describeParams({ owner, index })})`,
            async ({ rpc }) => {
                await expectCounterfactualAddress(
                    await SimpleSmartAccount.from({
                        client: getPublicClient(rpc.anvilRpc),
                        owner: anvilAccount(owner),
                        index: BigInt(index)
                    }),
                    entry
                )
            }
        )
    }
})
