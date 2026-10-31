import {
    type Address,
    type Hex,
    createPublicClient,
    custom,
    decodeFunctionData,
    encodeAbiParameters,
    encodePacked,
    getAddress,
    getContractAddress,
    keccak256,
    parseAbi,
    parseAbiParameters,
    zeroAddress
} from "viem"
import { toAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import { describe, expect, test } from "vitest"
import { toSafeSmartAccount } from "./toSafeSmartAccount.js"

// ABI of the verified Sepolia launchpad at
// 0x75798463024Bda64D83c94A64Bc7D7eaB41300eF, referenced in #482.
// Its ModuleInit ends with moduleType, and initSafe7579 has one modules array.
const v1SetupAbi = parseAbi([
    "function setupSafe((address singleton, address[] owners, uint256 threshold, address setupTo, bytes setupData, address safe7579, (address module, bytes initData, uint256 moduleType)[] validators, bytes callData) initData)"
])
const v1InitAbi = parseAbi([
    "function initSafe7579(address safe7579, (address module, bytes initData, uint256 moduleType)[] modules, address[] attesters, uint8 threshold)"
])
const preValidationAbi = parseAbi([
    "function preValidationSetup(bytes32 initHash, address to, bytes preInit)"
])
const factoryAbi = parseAbi([
    "function createProxyWithNonce(address singleton, bytes initializer, uint256 saltNonce) returns (address proxy)"
])
const initHashParameters = parseAbiParameters(
    "address, address[], uint256, address, bytes, address, (address module, bytes initData, uint256 moduleType)[]"
)

const launchpad = "0x75798463024Bda64D83c94A64Bc7D7eaB41300eF" as Address
const adapter = "0x7579f2ad53b01c3d8779fe17928e0d48885b0003" as Address
const legacyLaunchpad = "0x7579011aB74c46090561ea277Ba79D510c6C00ff" as Address
const legacyAdapter = "0x7579EE8307284F293B1927136486880611F20002" as Address
const owner = "0x1111111111111111111111111111111111111111" as Address
const validator = { address: owner, context: "0x11" as Hex }
const executor = {
    address: "0x2222222222222222222222222222222222222222" as Address,
    context: "0x22" as Hex
}
const fallback = {
    address: "0x3333333333333333333333333333333333333333" as Address,
    context: "0x33" as Hex
}
const hook = {
    address: "0x4444444444444444444444444444444444444444" as Address,
    context: "0x44" as Hex
}
const calls = [{ to: owner, value: 7n, data: "0x1234" as Hex }]
const proxyCreationCode = "0x60006000" as Hex

const createAccount = (version?: "legacy" | "v1", deployed = false) => {
    const client = createPublicClient({
        chain: sepolia,
        transport: custom({
            async request({ method }) {
                if (method === "eth_call") {
                    return encodeAbiParameters(
                        [{ type: "bytes" }],
                        [proxyCreationCode]
                    )
                }
                if (method === "eth_getCode") return deployed ? "0x6000" : "0x"
                if (method === "eth_chainId") return "0xaa36a7"
                throw new Error(`Unexpected RPC method: ${method}`)
            }
        })
    })
    return toSafeSmartAccount({
        client,
        owners: [toAccount(owner)],
        version: "1.4.1",
        erc7579LaunchpadAddress: version === "v1" ? launchpad : legacyLaunchpad,
        erc7579Version: version,
        safe4337ModuleAddress: version === "v1" ? adapter : legacyAdapter,
        validators: [validator],
        executors: [executor],
        fallbacks: [fallback],
        hooks: [hook],
        attesters: [hook.address, executor.address],
        attestersThreshold: 1,
        saltNonce: 42n
    })
}

describe("Safe7579 contract versions", () => {
    test("defaults to the existing legacy initializer and address", async () => {
        const implicit = await createAccount()
        const explicit = await createAccount("legacy")
        const { factoryData } = await implicit.getFactoryArgs()
        if (!factoryData) throw new Error("Missing factory args")
        // Frozen outputs from main before adding v1 support.
        expect(implicit.address).toBe(
            "0x4f7340e01d59bcA64f24F631b017F204674CfcBa"
        )
        expect(keccak256(factoryData)).toBe(
            "0x3cefcfe453af987fabf5d0131799481719e3f78f42722274c6830eea92f08c1c"
        )
        expect(keccak256(await implicit.encodeCalls(calls))).toBe(
            "0x33a8496ffb49f2f78b1de1510c29fcb94c7273a826e7ee25c79ed787154b6459"
        )
        expect(implicit.address).toBe(explicit.address)
        expect(await implicit.getFactoryArgs()).toEqual(
            await explicit.getFactoryArgs()
        )
        expect(await implicit.encodeCalls(calls)).toBe(
            await explicit.encodeCalls(calls)
        )
    })

    test("encodes v1 validators and the combined module list", async () => {
        const account = await createAccount("v1")
        const encoded = await account.encodeCalls(calls)
        // Selectors from the deployed ABI, frozen independently of the SDK.
        expect(encoded.slice(0, 10)).toBe("0xa3aa6b32")
        const {
            args: [initData]
        } = decodeFunctionData({
            abi: v1SetupAbi,
            data: encoded
        })
        expect(initData.validators).toEqual([
            { module: owner, initData: "0x11", moduleType: 1n }
        ])
        expect(initData.setupData.slice(0, 10)).toBe("0x9e5b1c2a")
        const { args } = decodeFunctionData({
            abi: v1InitAbi,
            data: initData.setupData
        })
        expect(args).toEqual([
            getAddress(adapter),
            [
                { module: executor.address, initData: "0x22", moduleType: 2n },
                { module: fallback.address, initData: "0x33", moduleType: 3n },
                { module: hook.address, initData: "0x44", moduleType: 4n }
            ],
            [executor.address, hook.address],
            1
        ])
        expect(await account.decodeCalls?.(encoded)).toEqual(calls)
    })

    test("commits the same v1 init data in factory args and first execution", async () => {
        const account = await createAccount("v1")
        const { factory, factoryData } = await account.getFactoryArgs()
        if (!factory || !factoryData) throw new Error("Missing factory args")
        const {
            args: [singleton, initializer, saltNonce]
        } = decodeFunctionData({
            abi: factoryAbi,
            data: factoryData
        })
        const {
            args: [actualHash, to, preInit]
        } = decodeFunctionData({
            abi: preValidationAbi,
            data: initializer
        })
        const {
            args: [initData]
        } = decodeFunctionData({
            abi: v1SetupAbi,
            data: await account.encodeCalls(calls)
        })
        // Safe7579Launchpad.hash implements abi.encode of these fields,
        // without callData. Compare the public factory and execution paths.
        const expectedHash = keccak256(
            encodeAbiParameters(initHashParameters, [
                initData.singleton,
                initData.owners,
                initData.threshold,
                initData.setupTo,
                initData.setupData,
                initData.safe7579,
                initData.validators
            ])
        )
        expect(actualHash).toBe(expectedHash)
        expect(to).toBe(zeroAddress)
        expect(preInit).toBe("0x")
        expect(singleton.toLowerCase()).toBe(launchpad.toLowerCase())
        const salt = keccak256(
            encodePacked(
                ["bytes32", "uint256"],
                [keccak256(initializer), saltNonce]
            )
        )
        expect(account.address).toBe(
            getContractAddress({
                from: factory,
                salt,
                bytecode: encodePacked(
                    ["bytes", "uint256"],
                    [proxyCreationCode, BigInt(singleton)]
                ),
                opcode: "CREATE2"
            })
        )
    })

    test("keeps deployed-account calls independent of the launchpad version", async () => {
        const legacy = await createAccount("legacy", true)
        const v1 = await createAccount("v1", true)
        const encoded = await v1.encodeCalls(calls)
        expect(encoded).toBe(await legacy.encodeCalls(calls))
        expect(await v1.decodeCalls?.(encoded)).toEqual(calls)
    })
})
