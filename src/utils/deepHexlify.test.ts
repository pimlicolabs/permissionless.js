import { beforeAll, expect, test } from "bun:test"
import dotenv from "dotenv"
import { deepHexlify } from "./deepHexlify.js"

dotenv.config()

beforeAll(() => {
    if (!process.env.STACKUP_API_KEY)
        throw new Error("STACKUP_API_KEY environment variable not set")
    if (!process.env.FACTORY_ADDRESS)
        throw new Error("FACTORY_ADDRESS environment variable not set")
    if (!process.env.TEST_PRIVATE_KEY)
        throw new Error("TEST_PRIVATE_KEY environment variable not set")
    if (!process.env.RPC_URL)
        throw new Error("RPC_URL environment variable not set")
    if (!process.env.ENTRYPOINT_ADDRESS)
        throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
})

test("Test deep Hexlify", async () => {
    expect(deepHexlify("abcd")).toBe("abcd")
    expect(deepHexlify(null)).toBe(null)
    expect(deepHexlify(true)).toBe(true)
    expect(deepHexlify(false)).toBe(false)
    expect(deepHexlify(1n)).toBe("0x1")
    expect(
        deepHexlify({
            name: "Garvit",
            balance: 1n
        })
    ).toEqual({
        name: "Garvit",
        balance: "0x1"
    })
})
