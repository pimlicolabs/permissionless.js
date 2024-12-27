import { http, createPublicClient } from "viem"
import {
    createBundlerClient,
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
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
import { createSmartAccountClient } from "../../clients/createSmartAccountClient"
import { createPimlicoClient } from "../../clients/pimlico"
import { signUserOperation } from "./signUserOperation"
import { toSafeSmartAccount } from "./toSafeSmartAccount"

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
                owners: owners.map((owner) => toAccount(owner.address))
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

    testWithRpc("signUserOperation_V07", async ({ rpc }) => {
        const { anvilRpc, altoRpc, paymasterRpc } = rpc

        const client = createPublicClient({
            chain: foundry,
            transport: http(anvilRpc)
        })

        const owners = [
            privateKeyToAccount(generatePrivateKey()),
            privateKeyToAccount(generatePrivateKey()),
            privateKeyToAccount(generatePrivateKey())
        ]

        const paymasterClient = createPimlicoClient({
            transport: http(paymasterRpc),
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            }
        })

        const pimlicoBundler = createPimlicoClient({
            transport: http(altoRpc),
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            }
        })

        const safeAccount = await toSafeSmartAccount({
            client,
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            },
            owners: owners.map((owner) => toAccount(owner.address)),
            version: "1.4.1",
            saltNonce: 420n
        })

        const safeAccountClient = createSmartAccountClient({
            client,
            account: safeAccount,
            paymaster: paymasterClient,
            bundlerTransport: http(altoRpc),
            userOperation: {
                estimateFeesPerGas: async () => {
                    return (await pimlicoBundler.getUserOperationGasPrice())
                        .fast
                }
            }
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
                address: entryPoint07Address,
                version: "0.7"
            },
            chainId: foundry.id,
            owners: [owners[0], owners[1], toAccount(owners[2].address)],
            ...unSignedUserOperation
        })

        const finalSignature = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
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
