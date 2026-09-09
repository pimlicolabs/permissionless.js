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
import { toThirdwebSmartAccount } from "./toThirdwebSmartAccount"

const buildAccount = (
    client: Client,
    params: CounterfactualAddressParams["thirdweb"]
) =>
    toThirdwebSmartAccount({
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        version: params.version,
        owner: anvilAccount(params.owner),
        salt: params.salt
    })

describe("toThirdwebSmartAccount counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("thirdweb")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }
})
