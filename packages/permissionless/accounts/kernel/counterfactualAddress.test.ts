import type { Client, LocalAccount } from "viem"
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
import { to7702KernelSmartAccount } from "./to7702KernelSmartAccount"
import { toEcdsaKernelSmartAccount } from "./toEcdsaKernelSmartAccount"
import { toKernelSmartAccount } from "./toKernelSmartAccount"

const buildAccount = (
    client: Client,
    params: CounterfactualAddressParams["kernel"]
) => {
    if (params.via === "to7702KernelSmartAccount") {
        return to7702KernelSmartAccount({
            client,
            entryPoint: toEntryPoint(params.entryPoint),
            owner: anvilAccount(params.owner)
        })
    }
    const owners: [LocalAccount] = [anvilAccount(params.owners[0])]
    const index = BigInt(params.index)
    if (params.entryPoint === "0.6") {
        const parameters = {
            client,
            entryPoint: toEntryPoint(params.entryPoint),
            version: params.version,
            owners,
            index
        }
        return params.via === "toEcdsaKernelSmartAccount"
            ? toEcdsaKernelSmartAccount(parameters)
            : toKernelSmartAccount(parameters)
    }
    const parameters = {
        client,
        entryPoint: toEntryPoint(params.entryPoint),
        version: params.version,
        owners,
        index,
        useMetaFactory: params.useMetaFactory
    }
    return params.via === "toEcdsaKernelSmartAccount"
        ? toEcdsaKernelSmartAccount(parameters)
        : toKernelSmartAccount(parameters)
}

describe("toKernelSmartAccount counterfactual addresses (0.x oracle)", () => {
    for (const entry of loadCounterfactualAddressFixture("kernel")) {
        testWithRpc(describeParams(entry.params), async ({ rpc }) => {
            await expectCounterfactualAddress(
                await buildAccount(getPublicClient(rpc.anvilRpc), entry.params),
                entry
            )
        })
    }
})
