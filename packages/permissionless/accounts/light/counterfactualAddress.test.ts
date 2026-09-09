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
import { toLightSmartAccount } from "./toLightSmartAccount"

const buildAccount = (
    client: Client,
    params: CounterfactualAddressParams["light"]
) =>
    toLightSmartAccount({
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        version: params.version,
        owner: anvilAccount(params.owner),
        index: BigInt(params.index)
    })

describe("toLightSmartAccount counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("light")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }
})
