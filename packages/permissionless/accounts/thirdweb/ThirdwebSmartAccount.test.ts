import { Account } from "viem"
import { EntryPoint } from "viem/erc4337"
import {
    type Address,
    Hash,
    Hex,
    Secp256k1,
    SignatureErc6492
} from "viem/utils"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getPublicClient,
    getSmartAccountClient
} from "../../../permissionless-test/src/utils"
import { EmptyCallsError } from "../../errors/account.js"
import * as ThirdwebSmartAccount from "./index.js"

const zeroAddress = "0x0000000000000000000000000000000000000000"

const typedData = {
    domain: {
        name: "Ether Mail",
        version: "1",
        chainId: 1,
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
    },
    types: {
        Person: [
            { name: "name", type: "string" },
            { name: "wallet", type: "address" }
        ],
        Mail: [
            { name: "from", type: "Person" },
            { name: "to", type: "Person" },
            { name: "contents", type: "string" }
        ]
    },
    primaryType: "Mail",
    message: {
        from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
        },
        to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
        },
        contents: "Hello, Bob!"
    }
} as const

const randomOwner = () => Account.fromPrivateKey(Secp256k1.randomPrivateKey())
const hash = Hash.keccak256(Hex.fromString("permissionless"))

describe("ThirdwebSmartAccount", () => {
    testWithRpc("defaults to EntryPoint 0.7 and 1.5.20", async ({ rpc }) => {
        const client = getPublicClient(rpc.anvilRpc)

        const account = await ThirdwebSmartAccount.from({
            client,
            owner: randomOwner()
        })
        expect(account.entryPoint).toMatchObject({
            address: EntryPoint.addressV07,
            version: "0.7"
        })
        expect((await account.getFactoryArgs()).factory).toBe(
            "0x4bE0ddfebcA9A5A4a617dee4DeCe99E7c862dceb"
        )

        const account06 = await ThirdwebSmartAccount.from({
            client,
            owner: randomOwner(),
            entryPoint: "0.6"
        })
        expect(account06.entryPoint).toMatchObject({
            address: EntryPoint.addressV06,
            version: "0.6"
        })
        expect((await account06.getFactoryArgs()).factory).toBe(
            "0x85e23b94e7F5E9cC1fF78BCe78cfb15B81f0DF00"
        )
    })

    testWithRpc(
        "resolves the nonce key per call, then nonceKey, then 0n",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = randomOwner()

            const account = await ThirdwebSmartAccount.from({ client, owner })
            expect(await account.getNonce()).toBe(0n)
            expect(await account.getNonce({ key: 7n })).toBe(7n << 64n)

            const keyed = await ThirdwebSmartAccount.from({
                client,
                owner,
                nonceKey: 3n
            })
            expect(await keyed.getNonce()).toBe(3n << 64n)
            expect(await keyed.getNonce({ key: 7n })).toBe(7n << 64n)

            const wide = await ThirdwebSmartAccount.from({
                client,
                owner,
                nonceKey: (1n << 160n) + 1n
            })
            expect(await wide.getNonce()).toBe(((1n << 160n) + 1n) << 64n)
        }
    )

    testWithRpc(
        "signs self-verifying typed data with the owner as-is",
        async ({ rpc }) => {
            const owner = randomOwner()
            const account = await ThirdwebSmartAccount.from({
                client: getPublicClient(rpc.anvilRpc),
                owner
            })

            for (const verifyingContract of [
                account.address,
                account.address.toLowerCase() as Address.Address
            ]) {
                const data = {
                    ...typedData,
                    domain: { ...typedData.domain, verifyingContract }
                }
                expect(
                    SignatureErc6492.unwrap(await account.signTypedData(data))
                        .signature
                ).toBe(await owner.signTypedData(data))
            }
        }
    )

    testWithRpc(
        "signatures verify before and after deployment",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const account = await ThirdwebSmartAccount.from({
                client,
                owner: randomOwner()
            })

            const verify = async () => {
                expect(
                    await client.typedData.verify({
                        ...typedData,
                        address: account.address,
                        signature: await account.signTypedData(typedData)
                    })
                ).toBe(true)
                expect(
                    await client.verifyMessage({
                        address: account.address,
                        message: "hello",
                        signature: await account.signMessage({
                            message: "hello"
                        })
                    })
                ).toBe(true)
                expect(
                    await client.verifyHash({
                        address: account.address,
                        hash,
                        signature: await account.sign({ hash })
                    })
                ).toBe(true)
            }

            await verify()

            const smartClient = getSmartAccountClient({ account, ...rpc })
            const receipt = await smartClient.userOperation.waitForReceipt({
                hash: await smartClient.userOperation.send({
                    calls: [{ to: zeroAddress, value: 0n }]
                })
            })
            expect(receipt.success).toBe(true)
            expect(await account.isDeployed()).toBe(true)

            await verify()
        }
    )

    for (const version of ["0.6", "0.7"] as const) {
        testWithRpc(
            `sends user operations on EntryPoint ${version}`,
            async ({ rpc }) => {
                const account = await ThirdwebSmartAccount.from({
                    client: getPublicClient(rpc.anvilRpc),
                    owner: randomOwner(),
                    entryPoint: version
                })
                const smartClient = getSmartAccountClient({ account, ...rpc })

                for (const calls of [
                    [{ to: zeroAddress, value: 0n }],
                    [
                        { to: zeroAddress, value: 0n },
                        { to: zeroAddress, data: "0x", value: 0n }
                    ]
                ] as const) {
                    const receipt =
                        await smartClient.userOperation.waitForReceipt({
                            hash: await smartClient.userOperation.send({
                                calls
                            })
                        })
                    expect(receipt.success).toBe(true)
                }
            }
        )
    }

    testWithRpc("encodes and decodes calls", async ({ rpc }) => {
        const account = await ThirdwebSmartAccount.from({
            client: getPublicClient(rpc.anvilRpc),
            owner: randomOwner()
        })

        const single = [
            { to: zeroAddress, value: 1n, data: "0xdeadbeef" }
        ] as const
        expect(
            await account.decodeCalls(await account.encodeCalls(single))
        ).toEqual(single)

        const batch = [
            { to: zeroAddress, value: 0n, data: "0x" },
            { to: account.address, value: 2n, data: "0xbeef" }
        ] as const
        expect(
            await account.decodeCalls(await account.encodeCalls(batch))
        ).toEqual(batch)

        expect(() => account.encodeCalls([])).toThrow(EmptyCallsError)
    })
})
