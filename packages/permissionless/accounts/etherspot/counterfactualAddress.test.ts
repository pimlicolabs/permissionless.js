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
import * as EtherspotSmartAccount from "./index"

const buildAccount = (
    client: Client.Client,
    params: CounterfactualAddressParams["etherspot"]
) =>
    EtherspotSmartAccount.from({
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        owner: anvilAccount(params.owners[0]),
        index: BigInt(params.index)
    })

describe("EtherspotSmartAccount.from counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("etherspot")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }
})
