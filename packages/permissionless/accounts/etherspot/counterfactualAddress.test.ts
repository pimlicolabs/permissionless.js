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
import { toEtherspotSmartAccount } from "./toEtherspotSmartAccount"

const buildAccount = (
    client: Client,
    params: CounterfactualAddressParams["etherspot"]
) =>
    toEtherspotSmartAccount({
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        owners: [anvilAccount(params.owners[0])],
        index: BigInt(params.index)
    })

describe("toEtherspotSmartAccount counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("etherspot")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }
})
