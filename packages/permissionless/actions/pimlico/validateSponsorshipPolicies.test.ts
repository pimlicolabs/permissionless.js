import { EntryPoint } from "viem/erc4337"
import { describe, expect } from "vitest"
import { getSimpleClient } from "../../../permissionless-test/src/accounts/simple"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPimlicoClient
} from "../../../permissionless-test/src/utils"
import { validateSponsorshipPolicies } from "./validateSponsorshipPolicies"

describe("validateSponsorshipPolicies", () => {
    testWithRpc("Validating sponsorship policies V06", async ({ rpc }) => {
        const { paymasterRpc } = rpc

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleClient({
                ...rpc,
                entryPoint: {
                    version: "0.6"
                }
            }),
            entryPoint: {
                version: "0.6"
            },
            ...rpc
        })

        const userOperation = await simpleAccountClient.userOperation.prepare({
            calls: [
                {
                    to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                    data: "0x",
                    value: 0n
                }
            ]
        })

        const pimlicoPaymasterClient = getPimlicoClient({
            entryPointVersion: "0.6",
            altoRpc: paymasterRpc
        })

        const policies = await validateSponsorshipPolicies(
            pimlicoPaymasterClient,
            {
                entryPointAddress: EntryPoint.addressV06,
                userOperation: userOperation,
                sponsorshipPolicyIds: ["sp_crazy_kangaroo"]
            }
        )

        expect(policies).toBeTruthy()
        expect(policies.length).toBeGreaterThan(0)
        expect(Array.isArray(policies)).toBe(true)
        expect(policies.length).toBe(1)
    })

    testWithRpc("Validating sponsorship policies V07", async ({ rpc }) => {
        const { paymasterRpc } = rpc

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleClient({
                ...rpc,
                entryPoint: {
                    version: "0.7"
                }
            }),
            entryPoint: {
                version: "0.7"
            },
            ...rpc
        })

        const userOperation = await simpleAccountClient.userOperation.prepare({
            calls: [
                {
                    to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                    data: "0x",
                    value: 0n
                }
            ]
        })

        const pimlicoPaymasterClient = getPimlicoClient({
            entryPointVersion: "0.7",
            altoRpc: paymasterRpc
        })

        const policies = await validateSponsorshipPolicies(
            pimlicoPaymasterClient,
            {
                entryPointAddress: EntryPoint.addressV07,
                userOperation: userOperation,
                sponsorshipPolicyIds: ["sp_crazy_kangaroo"]
            }
        )

        expect(policies).toBeTruthy()
        expect(policies.length).toBeGreaterThan(0)
        expect(Array.isArray(policies)).toBe(true)
        expect(policies.length).toBe(1)
    })

    testWithRpc("Validating sponsorship policies V08", async ({ rpc }) => {
        const { paymasterRpc } = rpc

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleClient({
                ...rpc,
                entryPoint: {
                    version: "0.8"
                }
            }),
            entryPoint: {
                version: "0.8"
            },
            ...rpc
        })

        const userOperation = await simpleAccountClient.userOperation.prepare({
            calls: [
                {
                    to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                    data: "0x",
                    value: 0n
                }
            ]
        })

        const pimlicoPaymasterClient = getPimlicoClient({
            entryPointVersion: "0.8",
            altoRpc: paymasterRpc
        })

        const policies = await validateSponsorshipPolicies(
            pimlicoPaymasterClient,
            {
                entryPointAddress: EntryPoint.addressV08,
                userOperation: userOperation,
                sponsorshipPolicyIds: ["sp_crazy_kangaroo"]
            }
        )

        expect(policies).toBeTruthy()
        expect(policies.length).toBeGreaterThan(0)
        expect(Array.isArray(policies)).toBe(true)
        expect(policies.length).toBe(1)
    })
})
