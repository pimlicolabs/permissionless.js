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
import { toSafeSmartAccount } from "./toSafeSmartAccount"

const buildAccount = (
    client: Client,
    params: CounterfactualAddressParams["safe"]
) => {
    const shared = {
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        version: params.version,
        owners: params.owners.map(anvilAccount),
        saltNonce: BigInt(params.saltNonce),
        threshold:
            params.threshold === undefined
                ? undefined
                : BigInt(params.threshold),
        useMultiSendForSetup: params.useMultiSendForSetup
    }
    if (params.erc7579) {
        return toSafeSmartAccount({ ...shared, ...params.erc7579 })
    }
    return toSafeSmartAccount({
        ...shared,
        setupTransactions: params.setupTransactions?.map((tx) => ({
            ...tx,
            value: BigInt(tx.value)
        }))
    })
}

describe("toSafeSmartAccount counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("safe")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }
})
