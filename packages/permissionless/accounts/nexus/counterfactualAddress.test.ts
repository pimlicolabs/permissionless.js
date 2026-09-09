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
import { toNexusSmartAccount } from "./toNexusSmartAccount"

const buildAccount = (
    client: Client,
    params: CounterfactualAddressParams["nexus"]
) =>
    toNexusSmartAccount({
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        version: params.version,
        owners: [anvilAccount(params.owners[0])],
        index: BigInt(params.index),
        attesters: params.attesters,
        threshold: params.threshold
    })

describe("toNexusSmartAccount counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("nexus")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }
})
