import { Account } from "viem"
import { describe, expect, test } from "vitest"
import {
    OwnerAddressRequiredError,
    OwnerSignUnsupportedError
} from "../errors/owner"
import { toOwner } from "./toOwner"

const address = "0x0000000000000000000000000000000000000001"
const provider = { request: async () => [] }

describe("toOwner", () => {
    test("rejects with OwnerAddressRequiredError when the provider has no accounts", async () => {
        await expect(toOwner({ owner: provider })).rejects.toThrow(
            OwnerAddressRequiredError
        )
    })

    test("provider owners only sign messages and typed data", async () => {
        const owner = await toOwner({ owner: provider, address })
        expect(owner.address).toBe(address)
        expect(() => owner.sign({ hash: "0x" })).toThrow(
            OwnerSignUnsupportedError
        )
    })

    test("local accounts are returned untouched", async () => {
        const account = Account.fromPrivateKey(`0x${"1".padStart(64, "0")}`)
        expect(await toOwner({ owner: account })).toBe(account)
    })

    test("falls back to eth_accounts when eth_requestAccounts is unavailable", async () => {
        const methods: string[] = []
        const owner = await toOwner({
            owner: {
                request: async ({ method }: { method: string }) => {
                    methods.push(method)
                    if (method === "eth_requestAccounts")
                        throw new Error("unsupported")
                    return [address]
                }
            }
        })
        expect(methods).toEqual(["eth_requestAccounts", "eth_accounts"])
        expect(owner.address).toBe(address)
    })

    test("signing is delegated to the wallet client", async () => {
        const signed: unknown[] = []
        const walletClient = {
            account: { address },
            signMessage: async (parameters: unknown) => {
                signed.push(parameters)
                return "0xmessage"
            },
            typedData: {
                sign: async (parameters: unknown) => {
                    signed.push(parameters)
                    return "0xtypedData"
                }
            }
        }
        const owner = await toOwner({ owner: walletClient as never })

        expect(owner.address).toBe(address)
        expect(await owner.signMessage({ message: "hello" })).toBe("0xmessage")
        const typedData = {
            domain: { name: "Pimlico" },
            types: { Foo: [{ name: "bar", type: "uint256" }] },
            primaryType: "Foo",
            message: { bar: 1n }
        } as never
        expect(await owner.signTypedData(typedData)).toBe("0xtypedData")
        expect(signed).toEqual([{ message: "hello" }, typedData])
    })
})
