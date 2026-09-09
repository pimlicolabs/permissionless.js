import { Account, Actions, Client, http } from "viem"
import { EntryPoint } from "viem/erc4337"
import { Address, Hex, PersonalMessage, Secp256k1, TypedData } from "viem/utils"
import { describe, expect, test } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { EmptyCallsError } from "../../errors/account.js"
import { TrustInvalidCallDataError } from "../../errors/trust.js"
import { encodeNonce } from "../../utils/encodeNonce.js"
import * as TrustSmartAccount from "./index.js"

const isValidSignatureAbi = [
    {
        type: "function",
        name: "isValidSignature",
        stateMutability: "view",
        inputs: [
            { name: "hash", type: "bytes32" },
            { name: "signature", type: "bytes" }
        ],
        outputs: [{ type: "bytes4" }]
    }
] as const

const typedData = {
    domain: { name: "Test", version: "1", chainId: 31337 },
    types: { Mail: [{ name: "contents", type: "string" }] },
    primaryType: "Mail",
    message: { contents: "hello" }
} as const

describe("TrustSmartAccount", () => {
    test("encodeCalls / decodeCalls round-trip", async () => {
        const account = await TrustSmartAccount.from({
            client: Client.create({ transport: http("http://localhost") }),
            owner: Account.fromPrivateKey(Secp256k1.randomPrivateKey()),
            address: Address.zero
        })
        const calls = [
            {
                to: Address.checksum(
                    "0x00000000000000000000000000000000000000aa"
                ),
                value: 1n,
                data: "0x01"
            },
            {
                to: Address.checksum(
                    "0x00000000000000000000000000000000000000bb"
                ),
                value: 0n,
                data: "0x"
            }
        ] as const

        expect(
            await account.decodeCalls?.(await account.encodeCalls([calls[0]]))
        ).toEqual([calls[0]])
        expect(
            await account.decodeCalls?.(await account.encodeCalls(calls))
        ).toEqual(calls)
        expect(() => account.encodeCalls([])).toThrow(EmptyCallsError)
        expect(() => account.decodeCalls?.("0xdeadbeef")).toThrow(
            TrustInvalidCallDataError
        )
    })

    testWithRpc(
        "nonce key: per-call, then nonceKey, then 0n",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = Account.fromPrivateKey(Secp256k1.randomPrivateKey())
            const account = await TrustSmartAccount.from({
                client,
                owner,
                nonceKey: 7n
            })
            expect(await account.getNonce({ key: 5n })).toBe(
                encodeNonce({ key: 5n, sequence: 0n })
            )
            expect(await account.getNonce()).toBe(
                encodeNonce({ key: 7n, sequence: 0n })
            )
            const largeKey = 2n ** 160n + 1n
            const largeKeyAccount = await TrustSmartAccount.from({
                client,
                owner,
                nonceKey: largeKey
            })
            expect(await largeKeyAccount.getNonce()).toBe(
                encodeNonce({ key: largeKey, sequence: 0n })
            )
            const defaultAccount = await TrustSmartAccount.from({
                client,
                owner
            })
            expect(await defaultAccount.getNonce()).toBe(0n)
        }
    )

    testWithRpc(
        "deploys through EntryPoint 0.6 and verifies ERC-1271 signatures",
        async ({ rpc }) => {
            const publicClient = getPublicClient(rpc.anvilRpc)
            const account = await TrustSmartAccount.from({
                client: publicClient,
                owner: Account.fromPrivateKey(Secp256k1.randomPrivateKey())
            })
            expect(account.entryPoint.address).toBe(EntryPoint.addressV06)
            expect(await account.isDeployed()).toBe(false)

            const smartAccountClient = getBundlerClient({
                account,
                ...rpc,
                entryPoint: { version: "0.6" }
            })
            const hash = await smartAccountClient.sendTransaction({
                to: Address.zero,
                value: 0n,
                data: "0x"
            })
            expect(hash).toMatch(/^0x[0-9a-f]{64}$/)
            expect(await account.isDeployed()).toBe(true)

            const message = "hello trust"
            const messageHash = PersonalMessage.getSignPayload(
                Hex.fromString(message)
            )
            const typedDataHash = TypedData.getSignPayload(typedData)
            for (const [digest, signature] of [
                [messageHash, await account.signMessage({ message })],
                [typedDataHash, await account.signTypedData(typedData)]
            ] as const) {
                expect(
                    await Actions.contract.read(publicClient, {
                        address: account.address,
                        abi: isValidSignatureAbi,
                        functionName: "isValidSignature",
                        args: [digest, signature]
                    })
                ).toBe("0x1626ba7e")
            }
        }
    )
})
