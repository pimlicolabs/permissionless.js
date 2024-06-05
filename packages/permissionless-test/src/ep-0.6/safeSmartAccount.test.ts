import { ENTRYPOINT_ADDRESS_V06 } from "permissionless"
import { isHash, zeroAddress } from "viem"
import { beforeAll, describe, expect, test } from "vitest"
import {
    ensureBundlerIsReady,
    ensurePaymasterIsReady,
    fund,
    getSafeClient
} from "../utils"

describe("Safe Specific Actions V0.6", () => {
    beforeAll(async () => {
        await ensureBundlerIsReady()
        await ensurePaymasterIsReady()
    })

    test("Can deploy with setup transaction", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            setupTransactions: [
                {
                    to: zeroAddress,
                    data: "0xff",
                    value: 0n
                }
            ]
        })

        await fund(smartAccountClient.account.address)

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expect(isHash(response)).toBe(true)
    }, 10000)
})
