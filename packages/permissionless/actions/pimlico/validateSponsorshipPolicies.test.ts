import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getPimlicoPaymasterClient,
    getSimpleAccountClient
} from "../../../permissionless-test/src/utils"
import { ENTRYPOINT_ADDRESS_V06 } from "../../utils"

describe("validateSponsorshipPolicies", () => {
    testWithRpc("Validating sponsorship policies", async ({ rpc }) => {
        const { anvilRpc, altoRpc, paymasterRpc } = rpc

        const simpleAccountClient = await getSimpleAccountClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            privateKey: generatePrivateKey(),
            altoRpc: altoRpc,
            anvilRpc: anvilRpc,
            paymasterClient: getPimlicoPaymasterClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                paymasterRpc
            })
        })

        const userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: "0x5af0d9827e0c53e4799bb226655a1de152a425a5",
                        data: "0x",
                        value: 0n
                    })
                }
            })

        const pimlicoPaymasterClient = getPimlicoPaymasterClient({
            entryPoint: ENTRYPOINT_ADDRESS_V06,
            paymasterRpc
        })

        const validateSponsorshipPolicies =
            await pimlicoPaymasterClient.validateSponsorshipPolicies({
                userOperation: userOperation,
                sponsorshipPolicyIds: ["sp_crazy_kangaroo"]
            })

        expect(validateSponsorshipPolicies).toBeTruthy()
        expect(validateSponsorshipPolicies.length).toBeGreaterThan(0)
        expect(Array.isArray(validateSponsorshipPolicies)).toBe(true)
        expect(validateSponsorshipPolicies.length).toBe(1)
    })
})
