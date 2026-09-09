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
import { to7702SimpleSmartAccount } from "./to7702SimpleSmartAccount"
import { toSimpleSmartAccount } from "./toSimpleSmartAccount"

const buildAccount = (
    client: Client,
    params: CounterfactualAddressParams["simple"]
) => {
    if (params.via === "to7702SimpleSmartAccount") {
        return to7702SimpleSmartAccount({
            client,
            entryPoint: toEntryPoint(params.entryPoint),
            owner: anvilAccount(params.owner)
        })
    }
    return toSimpleSmartAccount({
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        owner: anvilAccount(params.owner),
        index: BigInt(params.index)
    })
}

describe("toSimpleSmartAccount counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("simple")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }
})
