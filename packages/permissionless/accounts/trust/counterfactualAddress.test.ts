import type { Client } from "viem"
import { describe } from "vitest"
import {
    type CounterfactualAddressParams,
    anvilAccount,
    describeParams,
    expectCounterfactualAddress,
    loadCounterfactualAddressFixture,
    toEntryPoint
} from "../../../permissionless-test/src/fixtures/counterfactualAddresses"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getPublicClient } from "../../../permissionless-test/src/utils"
import { toTrustSmartAccount } from "./toTrustSmartAccount"

const buildAccount = (
    client: Client,
    params: CounterfactualAddressParams["trust"]
) =>
    toTrustSmartAccount({
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        owner: anvilAccount(params.owner),
        index: BigInt(params.index)
    })

describe("toTrustSmartAccount counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("trust")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }
})
