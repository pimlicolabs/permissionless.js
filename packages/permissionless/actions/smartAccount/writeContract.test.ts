import type { Chain } from "viem"
import type { BundlerClient, SmartAccount } from "viem/erc4337"
import { Abi, AbiFunction } from "viem/utils"
import { describe, expect, test } from "vitest"
import { writeContract } from "./writeContract"

const abi = Abi.from(["function transfer(address, uint256) returns (bool)"])
const address = "0x0000000000000000000000000000000000000001"
const to = "0x0000000000000000000000000000000000000002"

const client = (sent: unknown[]) =>
    ({
        request: () => {},
        // intercepts `getAction(client, sendTransaction, "sendTransaction")`
        sendTransaction: async (parameters: unknown) => {
            sent.push(parameters)
            return "0xdeadbeef"
        }
    }) as unknown as BundlerClient.Client<
        Chain.Chain | undefined,
        SmartAccount.SmartAccount
    >

describe("writeContract", () => {
    test("encodes the call and forwards it to sendTransaction", async () => {
        const sent: unknown[] = []
        const hash = await writeContract(client(sent), {
            abi,
            address,
            functionName: "transfer",
            args: [to, 1n],
            value: 2n
        })

        expect(hash).toBe("0xdeadbeef")
        expect(sent[0]).toEqual({
            to: address,
            value: 2n,
            data: AbiFunction.encodeData(AbiFunction.fromAbi(abi, "transfer"), [
                to,
                1n
            ])
        })
    })

    test("appends dataSuffix without its 0x prefix", async () => {
        const sent: unknown[] = []
        await writeContract(client(sent), {
            abi,
            address,
            functionName: "transfer",
            args: [to, 1n],
            dataSuffix: "0xc0ffee"
        })

        expect((sent[0] as { data: string }).data).toBe(
            `${AbiFunction.encodeData(AbiFunction.fromAbi(abi, "transfer"), [to, 1n])}c0ffee`
        )
    })
})
