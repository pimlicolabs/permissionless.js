import { Account } from "viem"
import {
    Abi,
    AbiFunction,
    Address,
    Hex,
    PersonalMessage,
    Secp256k1
} from "viem/utils"
import { describe, expect } from "vitest"
import { getNexusClient } from "../../../permissionless-test/src/accounts/nexus"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getPublicClient,
    getSmartAccountClient
} from "../../../permissionless-test/src/utils"
import { encodeNonce } from "../../utils/encodeNonce"
import * as NexusSmartAccount from "./index"

const validator = "0x00000004171351c442B202678c48D8AB5B321E8f"
const nexusNonce = (key: bigint) =>
    encodeNonce({
        key: Hex.toBigInt(
            Hex.concat(Hex.fromNumber(key, { size: 3 }), "0x00", validator)
        ),
        sequence: 0n
    })

describe("NexusSmartAccount.from", () => {
    testWithRpc(
        "nonce key: per-call, then nonceKey, then 0n",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = Account.fromPrivateKey(Secp256k1.randomPrivateKey())

            const account = await NexusSmartAccount.from({ client, owner })
            expect(await account.getNonce()).toBe(nexusNonce(0n))
            expect(await account.getNonce({ key: 7n })).toBe(nexusNonce(7n))

            const keyed = await NexusSmartAccount.from({
                client,
                owner,
                nonceKey: 5n
            })
            expect(await keyed.getNonce()).toBe(nexusNonce(5n))
            expect(await keyed.getNonce({ key: 7n })).toBe(nexusNonce(7n))
        }
    )

    testWithRpc("sorts attesters byte-wise", async ({ rpc }) => {
        const client = getPublicClient(rpc.anvilRpc)
        const owner = Account.fromPrivateKey(Secp256k1.randomPrivateKey())
        const attesters: Address.Address[] = [
            "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
            "0x000000333034E9f539ce08819E12c1b8Cb29084d"
        ]

        const [account, reversed] = await Promise.all([
            NexusSmartAccount.from({ client, owner, attesters, threshold: 1 }),
            NexusSmartAccount.from({
                client,
                owner,
                attesters: [...attesters].reverse(),
                threshold: 1
            })
        ])

        expect(reversed.address).toBe(account.address)
        const { factoryData } = await account.getFactoryArgs()
        expect(await reversed.getFactoryArgs()).toStrictEqual({
            factory: "0x00000bb19a3579F4D779215dEf97AFbd0e30DB55",
            factoryData
        })
        const createAccount = AbiFunction.from(
            "function createAccount(address eoaOwner, uint256 index, address[] attesters, uint8 threshold) returns (address)"
        )
        expect(
            AbiFunction.decodeData(createAccount, factoryData as Hex.Hex)
        ).toStrictEqual([
            owner.address,
            0n,
            [
                "0x000000333034E9f539ce08819E12c1b8Cb29084d",
                "0x4Fd8d57b94966982B62e9588C27B4171B55E8354"
            ],
            1
        ])
    })

    testWithRpc("sends user operations and signs ERC-1271", async ({ rpc }) => {
        const smartClient = getSmartAccountClient({
            ...rpc,
            account: await getNexusClient({
                entryPoint: { version: "0.7" },
                ...rpc
            })
        })
        const client = getPublicClient(rpc.anvilRpc)

        for (const _ of [0, 1]) {
            const hash = await smartClient.userOperation.send({
                calls: [{ to: Address.zero, value: 0n }]
            })
            const receipt = await smartClient.userOperation.waitForReceipt({
                hash
            })
            expect(receipt.success).toBe(true)
        }
        expect(await smartClient.account.isDeployed()).toBe(true)

        const message = "slowly and steadily burning the private keys"
        const signature = await smartClient.account.signMessage({ message })
        expect(
            await client.contract.read({
                address: smartClient.account.address,
                abi: Abi.from([
                    "function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)"
                ]),
                functionName: "isValidSignature",
                args: [
                    PersonalMessage.getSignPayload(Hex.fromString(message)),
                    signature
                ]
            })
        ).toBe("0x1626ba7e")
    })
})
