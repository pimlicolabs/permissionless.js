import type { Client } from "viem"
import { describe, expect } from "vitest"
import {
    anvilAccount,
    type CounterfactualAddressParams,
    describeParams,
    expectCounterfactualAddress,
    loadCounterfactualAddressFixture
} from "../../../permissionless-test/src/fixtures/counterfactualAddresses"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getPublicClient } from "../../../permissionless-test/src/utils"
import * as SafeSmartAccount from "./index"

const buildAccount = (
    client: Client.Client,
    params: CounterfactualAddressParams["safe"]
) =>
    SafeSmartAccount.from({
        client,
        entryPoint: params.entryPoint,
        version: params.version,
        owners: params.owners.map(anvilAccount),
        saltNonce: BigInt(params.saltNonce),
        threshold:
            params.threshold === undefined
                ? undefined
                : BigInt(params.threshold),
        useMultiSendForSetup: params.useMultiSendForSetup,
        ...params.erc7579
    })

describe("SafeSmartAccount.from counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("safe")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            const account = await buildAccount(
                getPublicClient(rpc.anvilRpc),
                entry.params
            )
            if (entry.params.setupTransactions) {
                expect(account.address).not.toBe(entry.address)
                return
            }
            await expectCounterfactualAddress(account, entry)
        })
    }
})
