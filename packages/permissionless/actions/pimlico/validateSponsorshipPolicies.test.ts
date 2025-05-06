import {
    entryPoint06Address,
    entryPoint07Address,
    entryPoint08Address
} from "viem/account-abstraction"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPimlicoClient,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"
import { validateSponsorshipPolicies } from "./validateSponsorshipPolicies"

describe("validateSponsorshipPolicies", () => {
    testWithRpc("Validating sponsorship policies V06", async ({ rpc }) => {
        const { paymasterRpc } = rpc

        const simpleAccountClient = getBundlerClient({
            account: await getSimpleAccountClient({
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

        const userOperation = await simpleAccountClient.prepareUserOperation({
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
                entryPointAddress: entryPoint06Address,
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
            account: await getSimpleAccountClient({
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

        const userOperation = await simpleAccountClient.prepareUserOperation({
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
                entryPointAddress: entryPoint07Address,
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
            account: await getSimpleAccountClient({
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

        const userOperation = await simpleAccountClient.prepareUserOperation({
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
                entryPointAddress: entryPoint08Address,
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
