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
import * as KernelSmartAccount from "./index"

const buildAccount = (
    client: Client.Client,
    params: CounterfactualAddressParams["kernel"]
) => {
    if (params.via === "to7702KernelSmartAccount")
        return KernelSmartAccount.from({
            client,
            entryPoint: toEntryPoint(params.entryPoint),
            owner: anvilAccount(params.owner),
            eip7702: true
        })
    const owner = anvilAccount(params.owners[0])
    const index = BigInt(params.index)
    if (params.entryPoint === "0.6")
        return KernelSmartAccount.from({
            client,
            entryPoint: toEntryPoint(params.entryPoint),
            version: params.version,
            owner,
            index
        })
    return KernelSmartAccount.from({
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        version: params.version,
        owner,
        index,
        useMetaFactory: params.useMetaFactory
    })
}

describe("KernelSmartAccount counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("kernel")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }
})
