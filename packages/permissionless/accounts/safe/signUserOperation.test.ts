import { http, createPublicClient } from "viem"
import { entryPoint06Address } from "viem/account-abstraction"
import {
    generatePrivateKey,
    privateKeyToAccount,
    toAccount
} from "viem/accounts"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { aw } from "vitest/dist/chunks/reporters.D7Jzd9GS.js"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getSafeClient
} from "../../../permissionless-test/src/utils"
import { signUserOperation } from "./signUserOperation"

describe("signUserOperation", () => {
    testWithRpc("signUserOperation_V06", async ({ rpc }) => {
        const { anvilRpc } = rpc

        const client = createPublicClient({
            transport: http(anvilRpc)
        })

        const owners = [
            privateKeyToAccount(generatePrivateKey()),
            privateKeyToAccount(generatePrivateKey()),
            privateKeyToAccount(generatePrivateKey())
        ]

        const safeAccountClient = getBundlerClient({
            account: await getSafeClient({
                ...rpc,
                entryPoint: {
                    version: "0.6"
                },
                owners
            }),
            entryPoint: {
                version: "0.6"
            },
            ...rpc
        })

        const unSignedUserOperation =
            await safeAccountClient.prepareUserOperation({
                calls: [
                    {
                        to: safeAccountClient.account.address,
                        data: "0x"
                    }
                ]
            })

        const partialSignatures = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint06Address,
                version: "0.6"
            },
            chainId: foundry.id,
            owners: [owners[0], owners[1], toAccount(owners[2].address)],
            ...unSignedUserOperation
        })

        const finalSignature = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint06Address,
                version: "0.6"
            },
            chainId: foundry.id,
            owners: [
                toAccount(owners[0].address),
                toAccount(owners[1].address),
                owners[2]
            ],
            signatures: partialSignatures,
            ...unSignedUserOperation
        })

        const userOpHash = safeAccountClient.sendUserOperation({
            ...unSignedUserOperation,
            signature: finalSignature
        })

        expect(userOpHash).toBeTruthy()

        const receipt = await safeAccountClient.waitForUserOperationReceipt({
            hash: await userOpHash
        })

        expect(receipt).toBeTruthy()
        expect(receipt.success).toBeTruthy()
    })
})
