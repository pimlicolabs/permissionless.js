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

    testWithRpc("signUserOperation_V07 with Safe as owner", async ({ rpc }) => {
        // Create the first Safe (owner Safe) with an EOA signer
        const ownerEOA = privateKeyToAccount(generatePrivateKey())

        const ownerSafeAccount = await getSafeClient({
            ...rpc,
            entryPoint: {
                version: "0.7"
            },
            owners: [ownerEOA]
        })

        const ownerSafeClient = getBundlerClient({
            account: ownerSafeAccount,
            entryPoint: {
                version: "0.7"
            },
            ...rpc
        })

        // Deploy the owner Safe first by sending a transaction
        const deployHash = await ownerSafeClient.sendUserOperation({
            calls: [
                {
                    to: ownerSafeAccount.address,
                    data: "0x",
                    value: 0n
                }
            ]
        })

        await ownerSafeClient.waitForUserOperationReceipt({
            hash: deployHash
        })

        // Verify owner Safe is deployed
        const isDeployed = await ownerSafeAccount.isDeployed()
        expect(isDeployed).toBe(true)

        // Create a LocalAccount-like object from the owner Safe
        // This wraps the Safe's signing methods in a LocalAccount interface
        const ownerSafeAsLocalAccount = toAccount({
            address: ownerSafeAccount.address,
            async signMessage({ message }) {
                return ownerSafeAccount.signMessage({ message })
            },
            async signTypedData(typedData) {
                return ownerSafeAccount.signTypedData(typedData)
            },
            async signTransaction() {
                throw new Error("signTransaction not supported for Safe owner")
            }
        })

        // Create a second Safe with the owner Safe as the owner
        const childSafeAccount = await getSafeClient({
            ...rpc,
            entryPoint: {
                version: "0.7"
            },
            owners: [ownerSafeAsLocalAccount]
        })

        const childSafeClient = getBundlerClient({
            account: childSafeAccount,
            entryPoint: {
                version: "0.7"
            },
            ...rpc
        })

        // Send a user operation from the child Safe (signed by the owner Safe)
        const userOpHash = await childSafeClient.sendUserOperation({
            calls: [
                {
                    to: childSafeAccount.address,
                    data: "0x",
                    value: 0n
                }
            ]
        })

        expect(userOpHash).toBeTruthy()

        const receipt = await childSafeClient.waitForUserOperationReceipt({
            hash: userOpHash
        })

        expect(receipt).toBeTruthy()
        expect(receipt.success).toBeTruthy()
    })
})
