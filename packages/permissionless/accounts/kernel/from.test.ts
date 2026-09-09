import { Account } from "viem"
import { anvil } from "viem/chains"
import { EntryPoint } from "viem/erc4337"
import { Secp256k1, Solidity } from "viem/utils"
import { describe, expect } from "vitest"
import { getKernelClient } from "../../../permissionless-test/src/accounts/kernel"
import {
    anvilAccount,
    type CounterfactualAddressParams,
    describeParams,
    expectCounterfactualAddress,
    loadCounterfactualAddressFixture
} from "../../../permissionless-test/src/fixtures/counterfactualAddresses"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { EmptyCallsError } from "../../errors/account"
import {
    KernelNonceKeyTooLargeError,
    KernelNotDelegatedError,
    KernelUnsupportedVersionError
} from "../../errors/kernel"
import { decodeNonce } from "../../utils/decodeNonce"
import * as KernelSmartAccount from "./index"
import { getNonceKeyWithEncoding } from "./utils/getNonceKey"

const zeroAddress = "0x0000000000000000000000000000000000000000"
const ecdsaValidator = {
    "0.2.2": "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390",
    "0.3.0-beta": "0x8104e3Ad430EA6d354d013A6789fDFc71E671c43"
} as const
const kernel033Logic = "0xd6CEDDe84be40893d153Be9d467CD6aD37875b28"

const fixture = (params: CounterfactualAddressParams["kernel"]) => {
    const key = (value: object) =>
        JSON.stringify(value, Object.keys(value).sort())
    const entry = loadCounterfactualAddressFixture("kernel").find(
        (entry) => key(entry.params) === key(params)
    )
    if (!entry)
        throw new Error(`no kernel fixture for ${describeParams(params)}`)
    return entry
}

const typedData = {
    domain: {
        name: "Ether Mail",
        version: "1",
        chainId: anvil.id,
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
    },
    types: { Mail: [{ name: "contents", type: "string" }] },
    primaryType: "Mail",
    message: { contents: "Hello, Bob!" }
} as const

describe("KernelSmartAccount.from", () => {
    testWithRpc(
        "defaults to EntryPoint 0.7, Kernel 0.3.0-beta and the meta factory",
        async ({ rpc }) => {
            const account = await KernelSmartAccount.from({
                client: getPublicClient(rpc.anvilRpc),
                owner: anvilAccount("anvil0")
            })
            expect(account.entryPoint.version).toBe("0.7")
            expect(account.entryPoint.address).toBe(EntryPoint.addressV07)
            await expectCounterfactualAddress(
                account,
                fixture({
                    via: "toKernelSmartAccount",
                    entryPoint: "0.7",
                    version: "0.3.0-beta",
                    owners: ["anvil0"],
                    index: "0",
                    useMetaFactory: true
                })
            )
        }
    )

    testWithRpc(
        "defaults to Kernel 0.2.2 on EntryPoint 0.6",
        async ({ rpc }) => {
            const account = await KernelSmartAccount.from({
                client: getPublicClient(rpc.anvilRpc),
                entryPoint: "0.6",
                owner: anvilAccount("anvil0")
            })
            expect(account.entryPoint.address).toBe(EntryPoint.addressV06)
            await expectCounterfactualAddress(
                account,
                fixture({
                    via: "toKernelSmartAccount",
                    entryPoint: "0.6",
                    version: "0.2.2",
                    owners: ["anvil0"],
                    index: "0"
                })
            )
        }
    )

    testWithRpc(
        "eip7702 defaults to Kernel 0.3.3 at the owner address",
        async ({ rpc }) => {
            const account = await KernelSmartAccount.from({
                client: getPublicClient(rpc.anvilRpc),
                owner: anvilAccount("anvil0"),
                eip7702: true
            })
            expect(account.implementation).toBe(kernel033Logic)
            expect(account.authorization.address).toBe(kernel033Logic)
            await expectCounterfactualAddress(
                account,
                fixture({
                    via: "to7702KernelSmartAccount",
                    entryPoint: "0.7",
                    owner: "anvil0"
                })
            )
        }
    )

    testWithRpc(
        "rejects a version the EntryPoint does not support",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            await expect(
                KernelSmartAccount.from({
                    client,
                    entryPoint: "0.6",
                    owner: Account.random(),
                    version: "0.3.1" as never
                })
            ).rejects.toBeInstanceOf(KernelUnsupportedVersionError)
            await expect(
                KernelSmartAccount.from({
                    client,
                    entryPoint: "0.6",
                    owner: Account.random(),
                    eip7702: true
                })
            ).rejects.toBeInstanceOf(KernelUnsupportedVersionError)
            await expect(
                KernelSmartAccount.from({
                    client,
                    entryPoint: "0.8" as never,
                    owner: Account.random()
                })
            ).rejects.toBeInstanceOf(KernelUnsupportedVersionError)
        }
    )

    testWithRpc(
        "nonce key: per-call, then nonceKey, then 0, packed with the validator",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = Account.random()
            const validator = ecdsaValidator["0.3.0-beta"]
            const packed = (key: bigint) =>
                getNonceKeyWithEncoding("0.3.0-beta", validator, key)
            expect(packed(7n)).toBe(BigInt(`0x0000${validator.slice(2)}0007`))

            const account = await KernelSmartAccount.from({
                client,
                owner,
                nonceKey: 5n
            })
            expect(decodeNonce(await account.getNonce()).key).toBe(packed(5n))
            expect(decodeNonce(await account.getNonce({ key: 7n })).key).toBe(
                packed(7n)
            )
            const plain = await KernelSmartAccount.from({ client, owner })
            expect(decodeNonce(await plain.getNonce()).key).toBe(packed(0n))
            expect(decodeNonce(await plain.getNonce({ key: 7n })).key).toBe(
                packed(7n)
            )
        }
    )

    testWithRpc(
        "rejects nonce keys above maxUint16 on Kernel v3",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = Account.random()
            const account = await KernelSmartAccount.from({ client, owner })
            await expect(
                account.getNonce({ key: Solidity.maxUint16 })
            ).resolves.toBeTypeOf("bigint")
            await expect(
                account.getNonce({ key: Solidity.maxUint16 + 1n })
            ).rejects.toBeInstanceOf(KernelNonceKeyTooLargeError)
            const large = await KernelSmartAccount.from({
                client,
                owner,
                nonceKey: Solidity.maxUint16 + 1n
            })
            await expect(large.getNonce()).rejects.toBeInstanceOf(
                KernelNonceKeyTooLargeError
            )
        }
    )

    testWithRpc(
        "passes the full EntryPoint nonce key through on Kernel v2",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = Account.random()
            const key = 2n ** 160n + 1n
            const account = await KernelSmartAccount.from({
                client,
                entryPoint: "0.6",
                owner,
                nonceKey: key
            })
            expect(decodeNonce(await account.getNonce()).key).toBe(key)
            expect(decodeNonce(await account.getNonce({ key: 3n })).key).toBe(
                3n
            )
            const plain = await KernelSmartAccount.from({
                client,
                entryPoint: "0.6",
                owner
            })
            expect(decodeNonce(await plain.getNonce()).key).toBe(0n)
        }
    )

    for (const [entryPoint, version] of [
        ["0.6", "0.2.2"],
        ["0.7", "0.3.1"]
    ] as const) {
        testWithRpc(
            `encodeCalls and decodeCalls round-trip on Kernel ${version}`,
            async ({ rpc }) => {
                const account = await KernelSmartAccount.from({
                    client: getPublicClient(rpc.anvilRpc),
                    entryPoint,
                    version,
                    owner: Account.random()
                })
                const single = [
                    { to: zeroAddress, value: 1n, data: "0xdeadbeef" }
                ] as const
                expect(
                    await account.decodeCalls?.(
                        await account.encodeCalls(single)
                    )
                ).toEqual(single)
                const batch = [
                    { to: zeroAddress, value: 1n, data: "0xdeadbeef" },
                    { to: zeroAddress }
                ] as const
                expect(
                    await account.decodeCalls?.(
                        await account.encodeCalls(batch)
                    )
                ).toEqual([
                    { to: zeroAddress, value: 1n, data: "0xdeadbeef" },
                    { to: zeroAddress, value: 0n, data: "0x" }
                ])
                if (version === "0.2.2")
                    expect(() => account.encodeCalls([])).toThrow(
                        EmptyCallsError
                    )
            }
        )
    }

    for (const [entryPoint, version, useMetaFactory] of [
        ["0.6", "0.2.2", true],
        ["0.7", "0.3.1", true],
        ["0.7", "0.3.1", false]
    ] as const) {
        testWithRpc(
            `sends user operations and verifies ERC-1271 on Kernel ${version}${useMetaFactory ? "" : " (factory)"}`,
            async ({ rpc }) => {
                const account = await getKernelClient({
                    entryPoint: { version: entryPoint },
                    version,
                    useMetaFactory,
                    ...rpc
                })
                const client = getBundlerClient({
                    account,
                    entryPoint: { version: entryPoint },
                    ...rpc
                })
                const publicClient = getPublicClient(rpc.anvilRpc)
                const message = "slowly and steadily burning the private keys"
                expect(
                    await publicClient.verifyMessage({
                        address: account.address,
                        message,
                        signature: await account.signMessage({ message })
                    })
                ).toBe(true)
                for (const _ of [0, 1]) {
                    const hash = await client.sendTransaction({
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    })
                    const receipt = await publicClient.transaction.getReceipt({
                        hash
                    })
                    expect(receipt.status).toBe("success")
                }
                expect(await account.isDeployed()).toBe(true)
                expect(
                    await publicClient.verifyMessage({
                        address: account.address,
                        message,
                        signature: await account.signMessage({ message })
                    })
                ).toBe(true)
                expect(
                    await publicClient.typedData.verify({
                        address: account.address,
                        signature: await account.signTypedData(typedData),
                        ...typedData
                    })
                ).toBe(true)
            }
        )
    }

    testWithRpc(
        "delegates an EOA to Kernel 0.3.3 with eip7702",
        async ({ rpc }) => {
            const privateKey = Secp256k1.randomPrivateKey()
            const owner = Account.fromPrivateKey(privateKey)
            const account = await getKernelClient({
                entryPoint: { version: "0.7" },
                privateKey,
                eip7702: true,
                ...rpc
            })
            const client = getBundlerClient({
                account,
                entryPoint: { version: "0.7" },
                ...rpc
            })
            const publicClient = getPublicClient(rpc.anvilRpc)
            const message = "slowly and steadily burning the private keys"
            await expect(
                account.signMessage({ message })
            ).rejects.toBeInstanceOf(KernelNotDelegatedError)
            const authorization = await owner.signAuthorization?.({
                address: kernel033Logic,
                chainId: anvil.id,
                nonce: BigInt(
                    await publicClient.address.getTransactionCount({
                        address: owner.address
                    })
                )
            })
            await client.sendTransaction({
                calls: [{ to: zeroAddress, value: 0n }],
                authorization
            } as Parameters<typeof client.sendTransaction>[0])
            expect(await account.isDeployed()).toBe(true)
            expect(
                await KernelSmartAccount.getVersion(publicClient, {
                    address: owner.address
                })
            ).toBe("0.3.3")
            expect(
                await publicClient.verifyMessage({
                    address: account.address,
                    message,
                    signature: await account.signMessage({ message })
                })
            ).toBe(true)
            expect(
                await publicClient.typedData.verify({
                    address: account.address,
                    signature: await account.signTypedData(typedData),
                    ...typedData
                })
            ).toBe(true)
        }
    )
})
