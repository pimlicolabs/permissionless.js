import {
    type Address,
    concat,
    decodeFunctionData,
    encodeFunctionData,
    encodePacked,
    getContractAddress,
    type Hex,
    hexToBigInt,
    keccak256,
    type LocalAccount,
    maxUint256,
    parseAbi,
    size
} from "viem"
import {
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { describe, expect } from "vitest"
import { erc20Address } from "../../../mock-paymaster/helpers/erc20-utils"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getBundlerClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import {
    type SafeVersion,
    type ToSafeSmartAccountParameters,
    toSafeSmartAccount
} from "./toSafeSmartAccount"

const createProxyWithNonceAbi = parseAbi([
    "function createProxyWithNonce(address _singleton, bytes initializer, uint256 saltNonce) returns (address proxy)"
])
const proxyCreationCodeAbi = parseAbi([
    "function proxyCreationCode() pure returns (bytes)"
])
const setupAbi = parseAbi([
    "function setup(address[] _owners, uint256 _threshold, address to, bytes data, address fallbackHandler, address paymentToken, uint256 payment, address paymentReceiver)"
])
const multiSendAbi = parseAbi(["function multiSend(bytes transactions)"])
const erc20Abi = parseAbi([
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
])

const spender: Address = "0x0000000000000000000000000000000000001337"

const approve = (amount: bigint) => ({
    to: erc20Address,
    data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount]
    }),
    value: 0n
})

const setupCall = approve(maxUint256)

type EntryPointVersion = "0.6" | "0.7"

const matrix: [SafeVersion, EntryPointVersion][] = [
    ["1.4.1", "0.6"],
    ["1.4.1", "0.7"],
    ["1.5.0", "0.7"]
]

const build = <entryPointVersion extends EntryPointVersion>({
    client,
    version = "1.4.1",
    entryPointVersion,
    owner,
    saltNonce,
    setupTransactions,
    address
}: {
    client: ToSafeSmartAccountParameters<entryPointVersion, undefined>["client"]
    version?: SafeVersion
    entryPointVersion: entryPointVersion
    owner: LocalAccount
    saltNonce?: bigint
    setupTransactions?: (typeof setupCall)[]
    address?: Address
}) =>
    toSafeSmartAccount<entryPointVersion, undefined>({
        client,
        owners: [owner],
        version,
        entryPoint: {
            address:
                entryPointVersion === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: entryPointVersion
        },
        saltNonce,
        setupTransactions,
        address
    })

const decodeInitCode = (factoryData: Hex) => {
    const {
        args: [singleton, initializer, saltNonce]
    } = decodeFunctionData({ abi: createProxyWithNonceAbi, data: factoryData })
    return { singleton, initializer, saltNonce }
}

const initCodeOf = async (account: {
    getFactoryArgs: () => Promise<{ factory?: Address; factoryData?: Hex }>
}) => {
    const { factory, factoryData } = await account.getFactoryArgs()
    if (!factory || !factoryData) throw new Error("account already deployed")
    return { factory, factoryData, ...decodeInitCode(factoryData) }
}

const decodeSetupPayload = (initializer: Hex) => {
    const {
        args: [owners, threshold, to, data]
    } = decodeFunctionData({ abi: setupAbi, data: initializer })
    const {
        args: [transactions]
    } = decodeFunctionData({ abi: multiSendAbi, data })
    return { owners, threshold, to, transactions }
}

const encodeSetupTransaction = (tx: typeof setupCall) =>
    encodePacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [0, tx.to, tx.value, BigInt(size(tx.data)), tx.data]
    )

const create2Salt = (initializer: Hex, saltNonce: bigint) =>
    keccak256(
        encodePacked(
            ["bytes32", "uint256"],
            [keccak256(initializer), saltNonce]
        )
    )

const deriveAddress = ({
    factory,
    proxyCreationCode,
    singleton,
    initializer,
    saltNonce
}: {
    factory: Address
    proxyCreationCode: Hex
    singleton: Address
    initializer: Hex
    saltNonce: bigint
}) =>
    getContractAddress({
        opcode: "CREATE2",
        from: factory,
        salt: create2Salt(initializer, saltNonce),
        bytecode: encodePacked(
            ["bytes", "uint256"],
            [proxyCreationCode, hexToBigInt(singleton)]
        )
    })

const allowanceOf = (
    client: ReturnType<typeof getPublicClient>,
    owner: Address
) =>
    client.readContract({
        abi: erc20Abi,
        address: erc20Address,
        functionName: "allowance",
        args: [owner, spender]
    })

describe("safe setupTransactions gate (spec §10)", () => {
    describe.each(matrix)(
        "safe %s / entryPoint %s",
        (version, entryPointVersion) => {
            testWithRpc(
                "setupTransactions are appended to the initializer's multiSend payload, so the CREATE2 salt and the address change (getInitializerCode → getAccountInitCode → getAccountAddress)",
                async ({ rpc }) => {
                    const client = getPublicClient(rpc.anvilRpc)
                    const owner = privateKeyToAccount(generatePrivateKey())

                    const [withSetup, without] = await Promise.all([
                        build({
                            client,
                            version,
                            entryPointVersion,
                            owner,
                            setupTransactions: [setupCall]
                        }),
                        build({ client, version, entryPointVersion, owner })
                    ])
                    const [a, b] = await Promise.all([
                        initCodeOf(withSetup),
                        initCodeOf(without)
                    ])

                    expect(a.factory).toBe(b.factory)
                    expect(a.singleton).toBe(b.singleton)
                    expect(a.saltNonce).toBe(b.saltNonce)
                    expect(a.initializer).not.toBe(b.initializer)

                    const pa = decodeSetupPayload(a.initializer)
                    const pb = decodeSetupPayload(b.initializer)
                    expect(pa.owners).toEqual(pb.owners)
                    expect(pa.threshold).toBe(pb.threshold)
                    expect(pa.to).toBe(pb.to)
                    expect(pa.transactions).toBe(
                        concat([
                            pb.transactions,
                            encodeSetupTransaction(setupCall)
                        ])
                    )

                    expect(create2Salt(a.initializer, a.saltNonce)).not.toBe(
                        create2Salt(b.initializer, b.saltNonce)
                    )

                    const proxyCreationCode = await client.readContract({
                        abi: proxyCreationCodeAbi,
                        address: a.factory,
                        functionName: "proxyCreationCode"
                    })
                    expect(deriveAddress({ ...a, proxyCreationCode })).toBe(
                        withSetup.address
                    )
                    expect(deriveAddress({ ...b, proxyCreationCode })).toBe(
                        without.address
                    )
                    expect(withSetup.address).not.toBe(without.address)
                }
            )
        }
    )

    testWithRpc(
        "the setupTransactions-free initializer is fixed by owners/threshold/version/entryPoint; saltNonce only enters the salt next to keccak256(initializer), so reaching a setupTransactions address without setupTransactions needs a keccak256 collision",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = privateKeyToAccount(generatePrivateKey())
            const entryPointVersion = "0.7"

            const [withSetup, omitted, empty, salted] = await Promise.all([
                build({
                    client,
                    entryPointVersion,
                    owner,
                    setupTransactions: [setupCall]
                }),
                build({ client, entryPointVersion, owner }),
                build({
                    client,
                    entryPointVersion,
                    owner,
                    setupTransactions: []
                }),
                build({ client, entryPointVersion, owner, saltNonce: 1n })
            ])
            const [legacy, i0, i0Empty, i0Salted] = await Promise.all([
                initCodeOf(withSetup),
                initCodeOf(omitted),
                initCodeOf(empty),
                initCodeOf(salted)
            ])

            expect(i0Empty.factoryData).toBe(i0.factoryData)
            expect(empty.address).toBe(omitted.address)

            expect(i0Salted.initializer).toBe(i0.initializer)
            expect(i0Salted.saltNonce).toBe(1n)
            expect(i0Salted.factoryData).not.toBe(i0.factoryData)
            expect(salted.address).not.toBe(omitted.address)

            expect(keccak256(i0.initializer)).not.toBe(
                keccak256(legacy.initializer)
            )
            expect(create2Salt(i0.initializer, legacy.saltNonce)).not.toBe(
                create2Salt(legacy.initializer, legacy.saltNonce)
            )

            const overridden = await build({
                client,
                entryPointVersion,
                owner,
                address: withSetup.address
            })
            expect(overridden.address).toBe(withSetup.address)
            const proxyCreationCode = await client.readContract({
                abi: proxyCreationCodeAbi,
                address: legacy.factory,
                functionName: "proxyCreationCode"
            })
            const overriddenInitCode = await initCodeOf(overridden)
            expect(overriddenInitCode.factoryData).toBe(i0.factoryData)
            expect(
                deriveAddress({ ...overriddenInitCode, proxyCreationCode })
            ).toBe(omitted.address)
            expect(
                deriveAddress({ ...overriddenInitCode, proxyCreationCode })
            ).not.toBe(withSetup.address)
        }
    )

    testWithRpc(
        "a setupTransactions-free account deployed through the first user operation's calldata reuses the 0.x initCode byte-for-byte and lands on the same address",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = privateKeyToAccount(generatePrivateKey())
            const account = await build({
                client,
                entryPointVersion: "0.7",
                owner
            })
            const initCode = await initCodeOf(account)

            const smartAccountClient = getBundlerClient({
                account,
                entryPoint: { version: "0.7" },
                ...rpc
            })
            const userOperation = await smartAccountClient.prepareUserOperation(
                {
                    calls: [setupCall]
                }
            )

            expect(userOperation.sender).toBe(account.address)
            expect(userOperation.factory).toBe(initCode.factory)
            expect(userOperation.factoryData).toBe(initCode.factoryData)
            expect(userOperation.callData).toBe(
                await account.encodeCalls([setupCall])
            )

            const hash = await smartAccountClient.sendUserOperation({
                ...userOperation,
                signature: await account.signUserOperation(userOperation)
            })
            const receipt =
                await smartAccountClient.waitForUserOperationReceipt({
                    hash
                })
            expect(receipt.success).toBe(true)
            expect(
                await client.getCode({ address: account.address })
            ).toBeTruthy()
            expect(await allowanceOf(client, account.address)).toBe(maxUint256)
        }
    )

    testWithRpc(
        "an already deployed setupTransactions account keeps working from the setupTransactions-free path when its address is passed explicitly (factory args are never sent for deployed accounts)",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = privateKeyToAccount(generatePrivateKey())
            const legacy = await build({
                client,
                entryPointVersion: "0.7",
                owner,
                setupTransactions: [setupCall]
            })

            const legacyClient = getBundlerClient({
                account: legacy,
                entryPoint: { version: "0.7" },
                ...rpc
            })
            const deploy = await legacyClient.waitForUserOperationReceipt({
                hash: await legacyClient.sendUserOperation({
                    calls: [{ to: legacy.address, data: "0x" }]
                })
            })
            expect(deploy.success).toBe(true)
            expect(await allowanceOf(client, legacy.address)).toBe(maxUint256)

            const migrated = await build({
                client,
                entryPointVersion: "0.7",
                owner,
                address: legacy.address
            })
            expect(migrated.address).toBe(legacy.address)
            expect(await migrated.getFactoryArgs()).toEqual({
                factory: undefined,
                factoryData: undefined
            })

            const migratedClient = getBundlerClient({
                account: migrated,
                entryPoint: { version: "0.7" },
                ...rpc
            })
            const receipt = await migratedClient.waitForUserOperationReceipt({
                hash: await migratedClient.sendUserOperation({
                    calls: [approve(0n)]
                })
            })
            expect(receipt.success).toBe(true)
            expect(await allowanceOf(client, legacy.address)).toBe(0n)
        }
    )

    testWithRpc(
        "address-stability pin: safe 1.4.1 / entryPoint 0.7, owner from private key 0x…01, saltNonce 0, with and without setupTransactions: [approve(erc20Address, 0x…1337, maxUint256)]",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = privateKeyToAccount(`0x${"1".padStart(64, "0")}`)
            const [account, legacy] = await Promise.all([
                build({ client, entryPointVersion: "0.7", owner }),
                build({
                    client,
                    entryPointVersion: "0.7",
                    owner,
                    setupTransactions: [setupCall]
                })
            ])
            const { factory, factoryData } = await initCodeOf(account)

            expect(owner.address).toBe(
                "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf"
            )
            expect(factory).toBe("0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67")
            expect(factoryData).toMatchInlineSnapshot(
                `"0x1688f0b900000000000000000000000041675c099f32341bf84bfc5382af534df5c7461a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000284b63e800d0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000038869bf66a61cf6bdb996a6ae40d5853fd43b526000000000000000000000000000000000000000000000000000000000000014000000000000000000000000075cf11467937ce3f2f357ce24ffc3dbf8fd5c22600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000007e5f4552091a69125d5dfcb7b8c2659029395bdf00000000000000000000000000000000000000000000000000000000000001048d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000b9012dd68b007b46fbe91b9a7c3eda5a7a1063cb5b47000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000648d0dc49f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000075cf11467937ce3f2f357ce24ffc3dbf8fd5c226000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"`
            )
            expect(account.address).toMatchInlineSnapshot(
                `"0x57E9161676313588c7F373F9Cb17b00f1e65BeF0"`
            )
            expect(legacy.address).not.toBe(account.address)
            expect(legacy.address).toMatchInlineSnapshot(
                `"0xe06d157D28EBFF7598687baBdd9c207861baC2b5"`
            )
        }
    )
})
