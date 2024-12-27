import {
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
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getSafeClient
} from "../../../permissionless-test/src/utils"
import { signUserOperation } from "./signUserOperation"

describe("signUserOperation", () => {
    testWithRpc("signUserOperation_V06", async ({ rpc }) => {
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

        let partialSignatures = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint06Address,
                version: "0.6"
            },
            chainId: foundry.id,
            owners: owners.map((owner) => toAccount(owner.address)),
            account: owners[0],
            ...unSignedUserOperation
        })

        partialSignatures = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint06Address,
                version: "0.6"
            },
            chainId: foundry.id,
            owners: owners.map((owner) => toAccount(owner.address)),
            account: owners[1],
            signatures: partialSignatures,
            ...unSignedUserOperation
        })

        const finalSignature = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint06Address,
                version: "0.6"
            },
            chainId: foundry.id,
            owners: owners.map((owner) => toAccount(owner.address)),
            account: owners[2],
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
        const owners = [
            privateKeyToAccount(generatePrivateKey()),
            privateKeyToAccount(generatePrivateKey()),
            privateKeyToAccount(generatePrivateKey())
        ]

        const safeAccountClient = getBundlerClient({
            account: await getSafeClient({
                ...rpc,
                entryPoint: {
                    version: "0.7"
                },
                owners: owners.map((owner) => toAccount(owner.address))
            }),
            entryPoint: {
                version: "0.7"
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

        let partialSignatures = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            },
            chainId: foundry.id,
            owners: owners.map((owner) => toAccount(owner.address)),
            account: owners[0],
            ...unSignedUserOperation
        })

        partialSignatures = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            },
            chainId: foundry.id,
            owners: owners.map((owner) => toAccount(owner.address)),
            account: owners[1],
            signatures: partialSignatures,
            ...unSignedUserOperation
        })

        const finalSignature = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            },
            chainId: foundry.id,
            owners: owners.map((owner) => toAccount(owner.address)),
            account: owners[2],
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

    testWithRpc("signUserOperation_V07 7579", async ({ rpc }) => {
        const { anvilRpc } = rpc

        const owners = [
            privateKeyToAccount(generatePrivateKey()),
            privateKeyToAccount(generatePrivateKey()),
            privateKeyToAccount(generatePrivateKey())
        ]

        const safeAccountClient = getBundlerClient({
            account: await getSafeClient({
                ...rpc,
                entryPoint: {
                    version: "0.7"
                },
                owners: owners.map((owner) => toAccount(owner.address)),
                erc7579: true
            }),
            entryPoint: {
                version: "0.7"
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

        let partialSignatures = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            },
            chainId: foundry.id,
            owners: owners.map((owner) => toAccount(owner.address)),
            account: owners[0],
            safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002",
            ...unSignedUserOperation
        })

        partialSignatures = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            },
            chainId: foundry.id,
            owners: owners.map((owner) => toAccount(owner.address)),
            account: owners[1],
            signatures: partialSignatures,
            safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002",
            ...unSignedUserOperation
        })

        const finalSignature = await signUserOperation({
            version: "1.4.1",
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            },
            chainId: foundry.id,
            owners: owners.map((owner) => toAccount(owner.address)),
            account: owners[2],
            signatures: partialSignatures,
            safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002",
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
