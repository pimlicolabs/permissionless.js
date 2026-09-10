import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { Account } from "viem"
import { EntryPoint, type SmartAccount } from "viem/erc4337"
import { Address, Hash, Hex } from "viem/utils"
import { expect } from "vitest"

export type AnvilKey = `anvil${number}`

export type CounterfactualAddressParams = {
    simple:
        | {
              via: "toSimpleSmartAccount"
              entryPoint: "0.6" | "0.7" | "0.8"
              owner: AnvilKey
              index: string
          }
        | {
              via: "to7702SimpleSmartAccount"
              entryPoint: "0.8"
              owner: AnvilKey
          }
    safe: {
        entryPoint: "0.6" | "0.7"
        version: "1.4.1" | "1.5.0"
        owners: AnvilKey[]
        saltNonce: string
        threshold?: string
        useMultiSendForSetup?: boolean
        setupTransactions?: {
            to: Address.Address
            data: Hex.Hex
            value: string
        }[]
        erc7579?: {
            safe4337ModuleAddress: Address.Address
            erc7579LaunchpadAddress: Address.Address
            attesters: Address.Address[]
            attestersThreshold: number
        }
    }
    kernel:
        | {
              via: "toKernelSmartAccount" | "toEcdsaKernelSmartAccount"
              entryPoint: "0.6"
              version: "0.2.1" | "0.2.2" | "0.2.3" | "0.2.4"
              owners: [AnvilKey]
              index: string
          }
        | {
              via: "toKernelSmartAccount" | "toEcdsaKernelSmartAccount"
              entryPoint: "0.7"
              version: "0.3.0-beta" | "0.3.1" | "0.3.2" | "0.3.3"
              owners: [AnvilKey]
              index: string
              useMetaFactory: boolean
          }
        | {
              via: "to7702KernelSmartAccount"
              entryPoint: "0.7"
              owner: AnvilKey
          }
    nexus: {
        entryPoint: "0.7"
        version: "1.0.0"
        owners: [AnvilKey]
        index: string
        attesters?: Address.Address[]
        threshold?: number
    }
    light: {
        entryPoint: "0.6" | "0.7"
        version: "1.1.0" | "2.0.0"
        owner: AnvilKey
        index: string
    }
    thirdweb: {
        entryPoint: "0.6" | "0.7"
        version: "1.5.20"
        owner: AnvilKey
        salt?: string
    }
    trust: { entryPoint: "0.6"; owner: AnvilKey; index: string }
    etherspot: { entryPoint: "0.7"; owners: [AnvilKey]; index: string }
}

export type CounterfactualAddressAccount = keyof CounterfactualAddressParams

export type CounterfactualAddressEntry<
    account extends CounterfactualAddressAccount = CounterfactualAddressAccount
> = {
    account: account
    params: CounterfactualAddressParams[account]
    address: Address.Address
    factory: Address.Address | null
    factoryDataHash: Hex.Hex | null
    initCodeHash: Hex.Hex | null
}

export const counterfactualAddressFixturePath = fileURLToPath(
    new URL("./counterfactualAddresses.0x.json", import.meta.url)
)

export const anvilAccount = (key: AnvilKey) =>
    Account.fromMnemonic(
        "test test test test test test test test test test test junk",
        { addressIndex: Number(key.slice("anvil".length)) }
    )

const entryPointAddresses = {
    "0.6": EntryPoint.addressV06,
    "0.7": EntryPoint.addressV07,
    "0.8": EntryPoint.addressV08
} as const

export const toEntryPoint = <version extends "0.6" | "0.7" | "0.8">(
    version: version
) => ({ address: entryPointAddresses[version], version })

export const loadCounterfactualAddressFixture = <
    account extends CounterfactualAddressAccount
>(
    account: account
) =>
    (
        JSON.parse(
            readFileSync(counterfactualAddressFixturePath, "utf8")
        ) as CounterfactualAddressEntry[]
    ).filter(
        (entry): entry is CounterfactualAddressEntry<account> =>
            entry.account === account
    )

export const describeParams = (params: object) =>
    Object.entries(params)
        .map(
            ([key, value]) =>
                `${key}=${typeof value === "object" ? JSON.stringify(value) : value}`
        )
        .join(" ")

export const snapshotCounterfactualAddress = async (
    account: SmartAccount.SmartAccount
) => {
    const { factory, factoryData } = await account.getFactoryArgs()
    return {
        address: Address.checksum(account.address),
        factory: factory ? Address.checksum(factory) : null,
        factoryDataHash: factoryData ? Hash.keccak256(factoryData) : null,
        initCodeHash:
            factory && factoryData
                ? Hash.keccak256(Hex.concat(factory, factoryData))
                : null
    }
}

export const expectCounterfactualAddress = async (
    account: SmartAccount.SmartAccount,
    {
        address,
        factory,
        factoryDataHash,
        initCodeHash
    }: CounterfactualAddressEntry
) => {
    expect(await snapshotCounterfactualAddress(account)).toStrictEqual({
        address,
        factory,
        factoryDataHash,
        initCodeHash
    })
}
