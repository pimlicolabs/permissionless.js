import { Account, Client, http } from "viem"
import { anvil } from "viem/chains"
import { EntryPoint } from "viem/erc4337"
import { Secp256k1 } from "viem/utils"
import { describe, expect, test } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getPublicClient } from "../../../permissionless-test/src/utils"
import { SimpleAccountFactoryAddressRequiredError } from "../../errors/simple.js"
import * as SimpleSmartAccount from "./index.js"

const owner = () => Account.fromPrivateKey(Secp256k1.randomPrivateKey())

describe("SimpleSmartAccount.from", () => {
    testWithRpc("nonce key: args.key ?? nonceKey ?? 0n", async ({ rpc }) => {
        const client = getPublicClient(rpc.anvilRpc)
        const account = await SimpleSmartAccount.from({
            client,
            owner: owner(),
            nonceKey: 5n
        })
        expect(await account.getNonce({ key: 7n })).toBe(7n << 64n)
        expect(await account.getNonce()).toBe(5n << 64n)
        expect(await account.getNonce({ key: 0n })).toBe(0n)

        const unkeyed = await SimpleSmartAccount.from({
            client,
            owner: owner()
        })
        expect(await unkeyed.getNonce()).toBe(0n)
        expect(await unkeyed.getNonce({ key: 2n ** 160n + 1n })).toBe(
            (2n ** 160n + 1n) << 64n
        )
    })

    testWithRpc("default entryPoint is 0.8", async ({ rpc }) => {
        const account = await SimpleSmartAccount.from({
            client: getPublicClient(rpc.anvilRpc),
            owner: owner()
        })
        expect(account.entryPoint.version).toBe("0.8")
        expect(account.entryPoint.address).toBe(EntryPoint.addressV08)
        expect((await account.getFactoryArgs()).factory).toBe(
            "0x13E9ed32155810FDbd067D4522C492D6f68E5944"
        )
    })

    testWithRpc("eip7702 address is the owner EOA", async ({ rpc }) => {
        const owner_ = owner()
        const account = await SimpleSmartAccount.from({
            client: getPublicClient(rpc.anvilRpc),
            owner: owner_,
            eip7702: true
        })
        expect(account.address).toBe(owner_.address)
        expect(account.entryPoint.version).toBe("0.8")
        expect(account.authorization).toStrictEqual({
            account: owner_,
            address: "0xe6Cae83BdE06E4c305530e199D7217f42808555B"
        })
        expect(await account.getFactoryArgs()).toStrictEqual({
            factory: undefined,
            factoryData: undefined
        })
    })

    test("entryPoint 0.9 requires factoryAddress", async () => {
        const client = Client.create({ chain: anvil, transport: http() })
        await expect(
            SimpleSmartAccount.from({
                client,
                owner: owner(),
                entryPoint: "0.9"
            })
        ).rejects.toThrow(SimpleAccountFactoryAddressRequiredError)
        const account = await SimpleSmartAccount.from({
            client,
            owner: owner(),
            entryPoint: "0.9",
            eip7702: true
        })
        expect(account.entryPoint.address).toBe(EntryPoint.addressV09)
        expect(account.authorization.address).toBe(
            "0xa46cc63eBF4Bd77888AA327837d20b23A63a56B5"
        )
    })
})
