import { http, createTestClient, size, slice } from "viem"
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
    getPublicClient,
    getSafeClient
} from "../../../permissionless-test/src/utils"
import { signUserOperation } from "./signUserOperation"
import { toSafeSmartAccount } from "./toSafeSmartAccount"

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

    testWithRpc("signUserOperation_V07 with dynamic owner", async ({ rpc }) => {
        const eoaOwner = privateKeyToAccount(generatePrivateKey())
        const dynamicSignerKey = privateKeyToAccount(generatePrivateKey())

        // Contract owner validated through EIP-1271. The runtime code echoes
        // the called selector back, so isValidSignature always returns the
        // expected magic value (both the bytes32 and legacy bytes variants).
        const erc1271OwnerAddress = privateKeyToAccount(
            generatePrivateKey()
        ).address

        const testClient = createTestClient({
            mode: "anvil",
            transport: http(rpc.anvilRpc),
            chain: foundry
        })

        await testClient.setCode({
            address: erc1271OwnerAddress,
            bytecode: "0x60003560e01c60e01b60005260206000f3"
        })

        // A KMS-style owner: signs with a local key but lives at the
        // ERC-1271 contract address.
        const dynamicOwner = toAccount({
            address: erc1271OwnerAddress,
            async signMessage({ message }) {
                return dynamicSignerKey.signMessage({ message })
            },
            async signTypedData(typedData) {
                // biome-ignore lint/suspicious/noExplicitAny: test helper
                return dynamicSignerKey.signTypedData(typedData as any)
            },
            async signTransaction() {
                throw new Error("Not supported")
            }
        })

        const account = await toSafeSmartAccount({
            client: getPublicClient(rpc.anvilRpc),
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            },
            owners: [eoaOwner, { owner: dynamicOwner, dynamic: true }],
            version: "1.4.1",
            saltNonce: 420n
        })

        const safeAccountClient = getBundlerClient({
            account,
            entryPoint: {
                version: "0.7"
            },
            ...rpc
        })

        const stubSignature = await account.getStubSignature()
        // 6 bytes validAfter + 6 bytes validUntil + 2 * 65 bytes static parts
        // + 32 bytes dynamic length + 65 bytes dynamic signature data
        expect(size(slice(stubSignature, 12))).toBe(130 + 32 + 65)

        const userOpHash = await safeAccountClient.sendUserOperation({
            calls: [
                {
                    to: account.address,
                    data: "0x"
                }
            ]
        })

        const receipt = await safeAccountClient.waitForUserOperationReceipt({
            hash: userOpHash
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
})
