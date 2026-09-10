import { Account } from "viem"
import { EntryPoint } from "viem/erc4337"
import { Hash, Hex, Secp256k1 } from "viem/utils"
import { describe, expect } from "vitest"
import {
    getEtherspotClient,
    validatorAddress
} from "../../../permissionless-test/src/accounts/etherspot"
import {
    anvilAccount,
    expectCounterfactualAddress,
    loadCounterfactualAddressFixture
} from "../../../permissionless-test/src/fixtures/counterfactualAddresses"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { EtherspotNonceKeyOverflowError } from "../../errors/etherspot"
import { decodeNonce } from "../../utils/decodeNonce"
import * as EtherspotSmartAccount from "./index"

const zeroAddress = "0x0000000000000000000000000000000000000000"
const hash = Hash.keccak256(Hex.fromString("permissionless"))
const typedData = {
    domain: {
        name: "Ether Mail",
        version: "1",
        chainId: 31337,
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
    },
    types: { Mail: [{ name: "contents", type: "string" }] },
    primaryType: "Mail",
    message: { contents: "Hello, Bob!" }
} as const

const encodeNonceKey = (key: bigint) =>
    BigInt(
        Hex.concat(validatorAddress, "0x0000", Hex.fromNumber(key, { size: 2 }))
    )

describe("EtherspotSmartAccount.from", () => {
    testWithRpc("defaults to EntryPoint 0.7 and index 0", async ({ rpc }) => {
        const entry = loadCounterfactualAddressFixture("etherspot").find(
            ({ params }) => params.index === "0"
        )
        if (!entry) throw new Error("etherspot fixture entry missing")

        const account = await EtherspotSmartAccount.from({
            client: getPublicClient(rpc.anvilRpc),
            owner: anvilAccount(entry.params.owners[0])
        })

        expect(account.entryPoint).toStrictEqual({
            abi: EntryPoint.abiV07,
            address: EntryPoint.addressV07,
            version: "0.7"
        })
        await expectCounterfactualAddress(account, entry)
    })

    testWithRpc(
        "nonce key: per-call, then nonceKey, then 0n",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = Account.fromPrivateKey(Secp256k1.randomPrivateKey())
            const keyOf = async (nonce: Promise<bigint>) =>
                decodeNonce(await nonce).key

            const account = await EtherspotSmartAccount.from({ client, owner })
            expect(await keyOf(account.getNonce())).toBe(encodeNonceKey(0n))
            expect(await keyOf(account.getNonce({ key: 7n }))).toBe(
                encodeNonceKey(7n)
            )

            const keyed = await EtherspotSmartAccount.from({
                client,
                owner,
                nonceKey: 3n
            })
            expect(await keyOf(keyed.getNonce())).toBe(encodeNonceKey(3n))
            expect(await keyOf(keyed.getNonce({ key: 7n }))).toBe(
                encodeNonceKey(7n)
            )

            await expect(keyed.getNonce({ key: 0x10000n })).rejects.toThrow(
                EtherspotNonceKeyOverflowError
            )
        }
    )

    testWithRpc(
        "sends user operations before and after deployment",
        async ({ rpc }) => {
            const account = await getEtherspotClient({
                ...rpc,
                entryPoint: { version: "0.7" }
            })
            const client = getBundlerClient({
                ...rpc,
                account,
                entryPoint: { version: "0.7" }
            })

            for (const deployed of [false, true]) {
                expect(await account.isDeployed()).toBe(deployed)
                const hash = await client.userOperation.send({
                    calls: [{ to: zeroAddress, value: 0n, data: "0x" }]
                })
                const receipt = await client.userOperation.waitForReceipt({
                    hash
                })
                expect(receipt.success).toBe(true)
            }
            expect(await account.isDeployed()).toBe(true)
        }
    )

    testWithRpc(
        "signMessage, signTypedData and sign verify through ERC-1271 before and after deployment",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const account = await getEtherspotClient({
                ...rpc,
                entryPoint: { version: "0.7" }
            })
            const message = "slowly and steadily burning the private keys"
            const verify = async () => {
                expect(
                    await client.verifyMessage({
                        address: account.address,
                        message,
                        signature: await account.signMessage({ message })
                    })
                ).toBe(true)
                expect(
                    await client.typedData.verify({
                        ...typedData,
                        address: account.address,
                        signature: await account.signTypedData(typedData)
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
            const bundlerClient = getBundlerClient({
                ...rpc,
                account,
                entryPoint: { version: "0.7" }
            })
            const receipt = await bundlerClient.userOperation.waitForReceipt({
                hash: await bundlerClient.userOperation.send({
                    calls: [{ to: zeroAddress, value: 0n, data: "0x" }]
                })
            })
            expect(receipt.success).toBe(true)
            expect(await account.isDeployed()).toBe(true)
            await verify()
        }
    )
})
