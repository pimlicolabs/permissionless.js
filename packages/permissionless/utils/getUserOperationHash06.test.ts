import { EntryPoint, UserOperation } from "viem/erc4337"
import { describe, expect, test } from "vitest"
import { getUserOperationHash06 } from "./getUserOperationHash06"

const userOperation = {
    sender: "0x1234567890123456789012345678901234567890",
    nonce: 7n,
    initCode:
        "0x9406cc6185a346906296840746125a0e449764545fbfb9cf000000000000000000000000f39fde79bc85f9c4a5fa44c6e5b5d3e2b1d59f3d0000000000000000000000000000000000000000000000000000000000000000",
    callData:
        "0xb61d27f6000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
    callGasLimit: 100_000n,
    verificationGasLimit: 200_000n,
    preVerificationGas: 50_000n,
    maxFeePerGas: 1_000_000_000n,
    maxPriorityFeePerGas: 500_000_000n,
    paymasterAndData:
        "0xe3dc822d77f8ca7ac74c30b0dffea9fcdcaaa321000000000000000000000000000000000000000000000000000000006735f5e10000000000000000000000000000000000000000000000000000000000000000",
    signature:
        "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
} as const

describe("getUserOperationHash06", () => {
    test("matches the 0.x (viem 2.44.4 getUserOperationHash) vector", () => {
        expect(
            getUserOperationHash06(userOperation, {
                chainId: 1,
                entryPointAddress: EntryPoint.addressV06
            })
        ).toBe(
            "0x391e71a86428c9a3abde3715a574e695ca80efd150a3b35ab779be284f19bd1f"
        )
    })

    test("treats missing initCode and paymasterAndData as empty bytes", () => {
        const { initCode: _, paymasterAndData: __, ...bare } = userOperation
        const hash = getUserOperationHash06(bare, {
            chainId: 137,
            entryPointAddress: EntryPoint.addressV06
        })
        expect(hash).toBe(
            "0xf03bd26e3313a0876edf1daa19a7528dd07b4834c97b633bd6274a77990eb228"
        )
        expect(
            getUserOperationHash06(
                { ...bare, initCode: "0x", paymasterAndData: "0x" },
                { chainId: 137, entryPointAddress: EntryPoint.addressV06 }
            )
        ).toBe(hash)
    })

    test("agrees with viem's UserOperation.hash for EntryPoint 0.6", () => {
        expect(
            getUserOperationHash06(userOperation, {
                chainId: 1,
                entryPointAddress: EntryPoint.addressV06
            })
        ).toBe(
            UserOperation.hash(userOperation, {
                chainId: 1,
                entryPointAddress: EntryPoint.addressV06,
                entryPointVersion: "0.6"
            })
        )
    })
})
