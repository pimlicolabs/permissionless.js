import { describe, expect, test } from "vitest"
import { sendCompressedUserOperation } from "./sendCompressedUserOperation"

describe("sendCompressedUserOperation", () => {
    test("returns hash from bundler", async () => {
        const expectedHash =
            "0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34"

        const mockClient = {
            request: async () => expectedHash
        } as any

        const result = await sendCompressedUserOperation(mockClient, {
            compressedUserOperation: "0xcompressed",
            inflatorAddress: "0x1234567890123456789012345678901234567890",
            entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
        })

        expect(result).toBe(expectedHash)
    })

    test("calls correct RPC method with correct params", async () => {
        let calledMethod: string | undefined
        let calledParams: any

        const mockClient = {
            request: async ({
                method,
                params
            }: { method: string; params: any }) => {
                calledMethod = method
                calledParams = params
                return "0xhash"
            }
        } as any

        const compressedOp = "0xcompresseddata"
        const inflator = "0x1234567890123456789012345678901234567890"
        const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

        await sendCompressedUserOperation(mockClient, {
            compressedUserOperation: compressedOp,
            inflatorAddress: inflator,
            entryPointAddress: entryPoint
        })

        expect(calledMethod).toBe("pimlico_sendCompressedUserOperation")
        expect(calledParams).toEqual([compressedOp, inflator, entryPoint])
    })
})
