import { encodeFunctionData } from "viem"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { sendTransaction } from "./sendTransaction.js"
import { writeContract } from "./writeContract.js"

vi.mock("./sendTransaction.js", () => ({
    sendTransaction: vi.fn()
}))

const abi = [
    {
        type: "function",
        name: "setBytes",
        stateMutability: "nonpayable",
        inputs: [{ name: "value", type: "bytes" }],
        outputs: []
    }
] as const

describe("writeContract", () => {
    beforeEach(() => {
        vi.mocked(sendTransaction).mockReset()
        vi.mocked(sendTransaction).mockResolvedValue("0xhash")
    })

    test("only strips a 0x prefix from dataSuffix", async () => {
        await writeContract(
            {} as never,
            {
                abi,
                address: "0x0000000000000000000000000000000000000001",
                functionName: "setBytes",
                args: ["0x"],
                dataSuffix: "0x12340x5678"
            } as never
        )

        expect(sendTransaction).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                data: `${encodeFunctionData({ abi, functionName: "setBytes", args: ["0x"] })}12340x5678`
            })
        )
    })
})
