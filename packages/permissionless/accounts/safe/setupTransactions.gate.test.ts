import { Account, Actions, type Client } from "viem"
import {
    Abi,
    AbiFunction,
    AbiParameters,
    Address,
    ContractAddress,
    Hash,
    Hex,
    Solidity
} from "viem/utils"
import { describe, expect } from "vitest"
import { erc20Address } from "../../../mock-paymaster/helpers/erc20-utils"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getAnvilWalletClient,
    getBundlerClient,
    getPublicClient,
    sealTransaction
} from "../../../permissionless-test/src/utils"
import * as SafeSmartAccount from "./index"

const createProxyWithNonceAbi = Abi.from([
    "function createProxyWithNonce(address _singleton, bytes initializer, uint256 saltNonce) returns (address proxy)"
])
const proxyCreationCodeAbi = Abi.from([
    "function proxyCreationCode() pure returns (bytes)"
])
const setupAbi = Abi.from([
    "function setup(address[] _owners, uint256 _threshold, address to, bytes data, address fallbackHandler, address paymentToken, uint256 payment, address paymentReceiver)"
])
const multiSendAbi = Abi.from(["function multiSend(bytes transactions)"])
const enableModulesSelector = AbiFunction.getSelector(
    "function enableModules(address[] modules)"
)
const erc20Abi = Abi.from([
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
])

const spender: Address.Address = "0x0000000000000000000000000000000000001337"

const approve = (amount: bigint) => ({
    to: erc20Address,
    data: AbiFunction.encodeData(erc20Abi, "approve", [spender, amount]),
    value: 0n
})

const setupCall = approve(Solidity.maxUint256)

const pinnedOwner = Account.fromPrivateKey(`0x${"1".padStart(64, "0")}`)

const LEGACY_ADDRESS = "0xe06d157D28EBFF7598687baBdd9c207861baC2b5"

type EntryPointVersion = "0.6" | "0.7"

const matrix: [SafeSmartAccount.Version, EntryPointVersion][] = [
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
    address
}: {
    client: Client.Client
    version?: SafeSmartAccount.Version
    entryPointVersion: entryPointVersion
    owner: Account.Local
    saltNonce?: bigint
    address?: Address.Address
}) =>
    SafeSmartAccount.from({
        client,
        owners: [owner],
        version,
        entryPoint: entryPointVersion,
        saltNonce,
        address
    })

const decodeInitCode = (factoryData: Hex.Hex) => {
    const [singleton, initializer, saltNonce] = AbiFunction.decodeData(
        createProxyWithNonceAbi,
        factoryData
    )
    return { singleton, initializer, saltNonce }
}

const initCodeOf = async (account: {
    getFactoryArgs: () => Promise<{
        factory?: Address.Address | "0x7702" | undefined
        factoryData?: Hex.Hex | undefined
    }>
}) => {
    const { factory, factoryData } = await account.getFactoryArgs()
    if (!factory || factory === "0x7702" || !factoryData)
        throw new Error("account already deployed")
    return { factory, factoryData, ...decodeInitCode(factoryData) }
}

const decodeSetup = (initializer: Hex.Hex) => {
    const [
        owners,
        threshold,
        to,
        data,
        fallbackHandler,
        paymentToken,
        payment,
        paymentReceiver
    ] = AbiFunction.decodeData(setupAbi, initializer)
    const [transactions] = AbiFunction.decodeData(multiSendAbi, data)
    return {
        owners,
        threshold,
        to,
        transactions,
        fallbackHandler,
        paymentToken,
        payment,
        paymentReceiver
    }
}

const decodeMultiSend = (transactions: Hex.Hex) => {
    const ops: { operation: number; to: Address.Address; data: Hex.Hex }[] = []
    let position = 0
    while (position < Hex.size(transactions)) {
        const operation = Hex.toNumber(
            Hex.slice(transactions, position, position + 1)
        )
        const to = Hex.slice(transactions, position + 1, position + 21)
        const length = Hex.toNumber(
            Hex.slice(transactions, position + 53, position + 85)
        )
        const data =
            length === 0
                ? "0x"
                : Hex.slice(transactions, position + 85, position + 85 + length)
        ops.push({ operation, to, data })
        position += 85 + length
    }
    return ops
}

const encodeSetupTransaction = (tx: typeof setupCall) =>
    AbiParameters.encodePacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [0, tx.to, tx.value, BigInt(Hex.size(tx.data)), tx.data]
    )

const toLegacyInitializer = (initializer: Hex.Hex) => {
    const setup = decodeSetup(initializer)
    return AbiFunction.encodeData(setupAbi, "setup", [
        setup.owners,
        setup.threshold,
        setup.to,
        AbiFunction.encodeData(multiSendAbi, "multiSend", [
            Hex.concat(setup.transactions, encodeSetupTransaction(setupCall))
        ]),
        setup.fallbackHandler,
        setup.paymentToken,
        setup.payment,
        setup.paymentReceiver
    ])
}

const create2Salt = (initializer: Hex.Hex, saltNonce: bigint) =>
    Hash.keccak256(
        AbiParameters.encodePacked(
            ["bytes32", "uint256"],
            [Hash.keccak256(initializer), saltNonce]
        )
    )

const deriveAddress = ({
    factory,
    proxyCreationCode,
    singleton,
    initializer,
    saltNonce
}: {
    factory: Address.Address
    proxyCreationCode: Hex.Hex
    singleton: Address.Address
    initializer: Hex.Hex
    saltNonce: bigint
}) =>
    Address.checksum(
        ContractAddress.fromCreate2({
            from: factory,
            salt: create2Salt(initializer, saltNonce),
            bytecode: AbiParameters.encodePacked(
                ["bytes", "uint256"],
                [proxyCreationCode, Hex.toBigInt(singleton)]
            )
        })
    )

const proxyCreationCodeOf = (client: Client.Client, factory: Address.Address) =>
    Actions.contract.read(client, {
        abi: proxyCreationCodeAbi,
        address: factory,
        functionName: "proxyCreationCode"
    })

const allowanceOf = (client: Client.Client, owner: Address.Address) =>
    Actions.contract.read(client, {
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
                "the initializer's multiSend payload holds only the module setup, the test-side CREATE2 re-derivation equals getAddress(), and the 0.x setupTransactions address is unreachable",
                async ({ rpc }) => {
                    const client = getPublicClient(rpc.anvilRpc)
                    const account = await build({
                        client,
                        version,
                        entryPointVersion,
                        owner: pinnedOwner
                    })
                    const initCode = await initCodeOf(account)

                    const setup = decodeSetup(initCode.initializer)
                    expect(setup.owners).toEqual([pinnedOwner.address])
                    expect(setup.threshold).toBe(1n)
                    const ops = decodeMultiSend(setup.transactions)
                    expect(ops).toHaveLength(1)
                    expect(ops[0]?.operation).toBe(1)
                    expect(ops[0]?.data.startsWith(enableModulesSelector)).toBe(
                        true
                    )

                    const proxyCreationCode = await proxyCreationCodeOf(
                        client,
                        initCode.factory
                    )
                    expect(
                        deriveAddress({ ...initCode, proxyCreationCode })
                    ).toBe(account.address)
                    expect(account.address).not.toBe(LEGACY_ADDRESS)
                }
            )
        }
    )

    testWithRpc(
        "saltNonce only enters the CREATE2 salt next to keccak256(initializer); appending a setup call to the initializer reproduces the frozen 0.x address, and `address` overrides derivation without changing the factory data",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const entryPointVersion = "0.7"

            const [omitted, salted, overridden] = await Promise.all([
                build({ client, entryPointVersion, owner: pinnedOwner }),
                build({
                    client,
                    entryPointVersion,
                    owner: pinnedOwner,
                    saltNonce: 1n
                }),
                build({
                    client,
                    entryPointVersion,
                    owner: pinnedOwner,
                    address: LEGACY_ADDRESS
                })
            ])
            const [i0, i0Salted, i0Overridden] = await Promise.all([
                initCodeOf(omitted),
                initCodeOf(salted),
                initCodeOf(overridden)
            ])

            expect(i0Salted.initializer).toBe(i0.initializer)
            expect(i0Salted.saltNonce).toBe(1n)
            expect(i0Salted.factoryData).not.toBe(i0.factoryData)
            expect(salted.address).not.toBe(omitted.address)

            const legacyInitializer = toLegacyInitializer(i0.initializer)
            expect(Hash.keccak256(legacyInitializer)).not.toBe(
                Hash.keccak256(i0.initializer)
            )
            expect(create2Salt(i0.initializer, i0.saltNonce)).not.toBe(
                create2Salt(legacyInitializer, i0.saltNonce)
            )

            const proxyCreationCode = await proxyCreationCodeOf(
                client,
                i0.factory
            )
            expect(
                deriveAddress({
                    ...i0,
                    initializer: legacyInitializer,
                    proxyCreationCode
                })
            ).toBe(LEGACY_ADDRESS)

            expect(overridden.address).toBe(LEGACY_ADDRESS)
            expect(i0Overridden.factoryData).toBe(i0.factoryData)
            expect(deriveAddress({ ...i0Overridden, proxyCreationCode })).toBe(
                omitted.address
            )
            expect(
                deriveAddress({ ...i0Overridden, proxyCreationCode })
            ).not.toBe(LEGACY_ADDRESS)
        }
    )

    testWithRpc(
        "a setupTransactions-free account deployed through the first user operation's calldata reuses the 0.x initCode byte-for-byte and lands on the same address",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const account = await build({
                client,
                entryPointVersion: "0.7",
                owner: Account.random()
            })
            const initCode = await initCodeOf(account)

            const smartAccountClient = getBundlerClient({
                account,
                entryPoint: { version: "0.7" },
                ...rpc
            })
            const userOperation =
                await smartAccountClient.userOperation.prepare({
                    calls: [setupCall]
                })

            expect(userOperation.sender).toBe(account.address)
            expect(userOperation.factory).toBe(initCode.factory)
            expect(userOperation.factoryData).toBe(initCode.factoryData)
            expect(userOperation.callData).toBe(
                await account.encodeCalls([setupCall])
            )

            const hash = await smartAccountClient.userOperation.send({
                ...userOperation,
                signature: await account.signUserOperation(userOperation)
            })
            const receipt =
                await smartAccountClient.userOperation.waitForReceipt({ hash })
            expect(receipt.success).toBe(true)
            expect(
                await Actions.address.getCode(client, {
                    address: account.address
                })
            ).toBeTruthy()
            expect(await allowanceOf(client, account.address)).toBe(
                Solidity.maxUint256
            )
        }
    )

    testWithRpc(
        "a Safe deployed on 0.x with setupTransactions keeps working when its address is passed explicitly (factory args are never sent for deployed accounts)",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const owner = Account.random()
            const account = await build({
                client,
                entryPointVersion: "0.7",
                owner
            })
            const { factory, singleton, initializer, saltNonce } =
                await initCodeOf(account)

            const legacyInitializer = toLegacyInitializer(initializer)
            const legacyAddress = deriveAddress({
                factory,
                singleton,
                saltNonce,
                initializer: legacyInitializer,
                proxyCreationCode: await proxyCreationCodeOf(client, factory)
            })
            expect(legacyAddress).not.toBe(account.address)

            const deployer = getAnvilWalletClient({
                addressIndex: 0,
                anvilRpc: rpc.anvilRpc
            })
            await sealTransaction({
                anvilRpc: rpc.anvilRpc,
                hash: await deployer.contract.write({
                    abi: createProxyWithNonceAbi,
                    address: factory,
                    functionName: "createProxyWithNonce",
                    args: [singleton, legacyInitializer, saltNonce]
                })
            })
            expect(
                await Actions.address.getCode(client, {
                    address: legacyAddress
                })
            ).toBeTruthy()
            expect(await allowanceOf(client, legacyAddress)).toBe(
                Solidity.maxUint256
            )

            const migrated = await build({
                client,
                entryPointVersion: "0.7",
                owner,
                address: legacyAddress
            })
            expect(migrated.address).toBe(legacyAddress)
            expect(await migrated.getFactoryArgs()).toEqual({
                factory: undefined,
                factoryData: undefined
            })

            const migratedClient = getBundlerClient({
                account: migrated,
                entryPoint: { version: "0.7" },
                ...rpc
            })
            const receipt = await migratedClient.userOperation.waitForReceipt({
                hash: await migratedClient.userOperation.send({
                    calls: [approve(0n)]
                })
            })
            expect(receipt.success).toBe(true)
            expect(await allowanceOf(client, legacyAddress)).toBe(0n)
        }
    )

    testWithRpc(
        "address-stability pin: safe 1.4.1 / entryPoint 0.7, owner from private key 0x…01, saltNonce 0; the 0.x setupTransactions: [approve(erc20Address, 0x…1337, maxUint256)] address stays unreachable",
        async ({ rpc }) => {
            const client = getPublicClient(rpc.anvilRpc)
            const account = await build({
                client,
                entryPointVersion: "0.7",
                owner: pinnedOwner
            })
            const { factory, factoryData } = await initCodeOf(account)

            expect(pinnedOwner.address).toBe(
                "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf"
            )
            expect(factory).toBe("0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67")
            expect(factoryData).toMatchInlineSnapshot(
                `"0x1688f0b900000000000000000000000041675c099f32341bf84bfc5382af534df5c7461a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000284b63e800d0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000038869bf66a61cf6bdb996a6ae40d5853fd43b526000000000000000000000000000000000000000000000000000000000000014000000000000000000000000075cf11467937ce3f2f357ce24ffc3dbf8fd5c22600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000007e5f4552091a69125d5dfcb7b8c2659029395bdf00000000000000000000000000000000000000000000000000000000000001048d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000b9012dd68b007b46fbe91b9a7c3eda5a7a1063cb5b47000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000648d0dc49f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000075cf11467937ce3f2f357ce24ffc3dbf8fd5c226000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"`
            )
            expect(account.address).toMatchInlineSnapshot(
                `"0x57E9161676313588c7F373F9Cb17b00f1e65BeF0"`
            )
            expect(account.address).not.toBe(LEGACY_ADDRESS)
        }
    )
})
