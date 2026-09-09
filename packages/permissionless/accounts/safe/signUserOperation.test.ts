import { http, createTestClient, padHex, size, slice } from "viem"
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

        // Contract owner validated through EIP-1271. The owner "signs" with a
        // fixed 65-byte marker signature and the owner contract only returns
        // the magic value when that marker arrives in the signature argument,
        // proving the dynamic part is threaded through to isValidSignature.
        const markerSignature = padHex("0xc0ffee", { dir: "right", size: 65 })

        const erc1271OwnerAddress = privateKeyToAccount(
            generatePrivateKey()
        ).address

        const testClient = createTestClient({
            mode: "anvil",
            transport: http(rpc.anvilRpc),
            chain: foundry
        })

        // Minimal EIP-1271 validator. Safe v1.4.1 calls the legacy
        // isValidSignature(bytes _data, bytes _signature) variant, so the
        // calldata layout is: 4-byte selector, then the two head words with
        // the offsets of the `_data` and `_signature` tails. The code loads
        // the first 32 bytes of `_signature`, requires them to start with the
        // 0xc0ffee marker, and only then returns the magic value 0x20c13b0b
        // (the selector of the legacy variant); anything else reverts:
        //
        //   PUSH1 0x24 CALLDATALOAD   // offset of `_signature` tail
        //   PUSH1 0x24 ADD            // + 4-byte selector + 32-byte length
        //   CALLDATALOAD              // signature[0..32]
        //   PUSH1 0xe8 SHR            // >> 232 bits: keep first 3 bytes
        //   PUSH3 0xc0ffee EQ         // matches the marker?
        //   PUSH1 0x17 JUMPI          // if so, jump to the return block
        //   PUSH1 0x00 PUSH1 0x00 REVERT
        //   JUMPDEST                  // 0x17
        //   PUSH4 0x20c13b0b          // legacy EIP-1271 magic value
        //   PUSH1 0xe0 SHL            // left-align it as bytes4
        //   PUSH1 0x00 MSTORE         // store word at memory offset 0
        //   PUSH1 0x20 PUSH1 0x00 RETURN // return that 32-byte word
        await testClient.setCode({
            address: erc1271OwnerAddress,
            bytecode:
                "0x6024356024013560e81c62c0ffee1460175760006000fd5b6320c13b0b60e01b60005260206000f3"
        })

        // An owner that lives at the ERC-1271 contract address and produces
        // the marker signature the contract expects.
        const dynamicOwner = toAccount({
            address: erc1271OwnerAddress,
            async signMessage() {
                return markerSignature
            },
            async signTypedData() {
                return markerSignature
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
