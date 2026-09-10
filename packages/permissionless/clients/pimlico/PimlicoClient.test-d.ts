import { type SafeSmartAccount, SmartAccountClient } from "permissionless"
import {
    type Pimlico,
    PimlicoClient,
    pimlicoActions
} from "permissionless/pimlico"
import { type Chain, http, type Transport } from "viem"
import { sepolia } from "viem/chains"
import {
    EntryPoint,
    type PaymasterClient,
    type SmartAccount
} from "viem/erc4337"
import type { Address, Hex, RpcSchema } from "viem/utils"
import { describe, expectTypeOf, test } from "vitest"

declare const safeAccount: SafeSmartAccount.ReturnType

type CustomSchema = RpcSchema.From<{
    Request: { method: "custom_method"; params: [value: string] }
    ReturnType: string
}>
declare const withSchema: PimlicoClient.Client<
    "0.7",
    Transport.Transport,
    Chain.Chain | undefined,
    SmartAccount.SmartAccount | undefined,
    undefined,
    CustomSchema
>

const transport = http("https://bundler.invalid")

describe("PimlicoClient", () => {
    test("namespace names", () => {
        expectTypeOf<keyof typeof PimlicoClient>().toEqualTypeOf<"create">()
        expectTypeOf<PimlicoClient.Client>().not.toBeAny()
        expectTypeOf<PimlicoClient.Config>().not.toBeAny()
        expectTypeOf<PimlicoClient.Schema>().not.toBeAny()
        expectTypeOf<PimlicoClient.Schema>().toExtend<RpcSchema.Generic>()
    })

    test("create defaults to EntryPoint 0.7 and keeps the chain", () => {
        const client = PimlicoClient.create({ chain: sepolia, transport })
        expectTypeOf(client).toEqualTypeOf<
            PimlicoClient.Client<
                "0.7",
                typeof transport,
                typeof sepolia,
                SmartAccount.SmartAccount | undefined,
                undefined,
                undefined
            >
        >()
        expectTypeOf(client.chain).toEqualTypeOf<typeof sepolia>()
        expectTypeOf(client.account).toEqualTypeOf<
            SmartAccount.SmartAccount | undefined
        >()
    })

    test("entryPoint picks the sponsor types", () => {
        const client06 = PimlicoClient.create({
            transport,
            entryPoint: { address: EntryPoint.addressV06, version: "0.6" }
        })
        expectTypeOf(
            client06.sponsorUserOperation
        ).returns.resolves.toHaveProperty("paymasterAndData")
        const client08 = PimlicoClient.create({
            transport,
            entryPoint: { address: EntryPoint.addressV08, version: "0.8" }
        })
        expectTypeOf(
            client08.sponsorUserOperation
        ).returns.resolves.toHaveProperty("paymasterData")
        expectTypeOf(client08.chain).toEqualTypeOf<undefined>()
    })

    test("actions ride the client", () => {
        const client = PimlicoClient.create({ chain: sepolia, transport })
        expectTypeOf(
            client.getUserOperationGasPrice
        ).returns.resolves.toEqualTypeOf<Pimlico.GetUserOperationGasPriceReturnType>()
        expectTypeOf(client.getUserOperationStatus)
            .parameter(0)
            .toEqualTypeOf<Pimlico.GetUserOperationStatusParameters>()
        expectTypeOf(
            client.validateSponsorshipPolicies
        ).returns.resolves.toEqualTypeOf<
            Pimlico.ValidateSponsorshipPolicies[]
        >()
        expectTypeOf(client.getTokenQuotes).toBeFunction()
        expectTypeOf(client.estimateErc20PaymasterCost).toBeFunction()
        expectTypeOf(
            client.userOperation.send
        ).returns.resolves.toEqualTypeOf<Hex.Hex>()
        expectTypeOf(client.paymaster).toEqualTypeOf<
            PaymasterClient.Decorator["paymaster"]
        >()
        expectTypeOf(
            pimlicoActions({
                entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
            })(client)
        ).toEqualTypeOf<Pimlico.Actions<typeof sepolia, "0.7">>()
    })

    test("a PimlicoClient is a SmartAccountClient paymaster", () => {
        const client = PimlicoClient.create({ transport })
        expectTypeOf(client).toExtend<PaymasterClient.Decorator>()
        expectTypeOf(client).toExtend<
            NonNullable<SmartAccountClient.Config["paymaster"]>
        >()
        expectTypeOf(SmartAccountClient.create).toBeCallableWith({
            account: safeAccount,
            chain: sepolia,
            bundlerTransport: transport,
            paymaster: client
        })
    })

    test("config accepts an explicit entryPoint and rpc schema", () => {
        expectTypeOf<PimlicoClient.Config["entryPoint"]>().toEqualTypeOf<
            | { address: Address.Address; version: EntryPoint.Version }
            | undefined
        >()
        expectTypeOf(PimlicoClient.create).toBeCallableWith({
            chain: sepolia,
            transport,
            entryPoint: { address: EntryPoint.addressV07, version: "0.7" },
            key: "pimlico",
            name: "Pimlico",
            pollingInterval: 100
        })
    })

    test("precise instance assigns to the bare alias (#500)", () => {
        const precise = PimlicoClient.create({
            chain: sepolia,
            transport,
            entryPoint: { address: EntryPoint.addressV07, version: "0.7" }
        })
        const bare: PimlicoClient.Client = precise
        expectTypeOf(bare).toEqualTypeOf<PimlicoClient.Client>()
        const bareFromSchema: PimlicoClient.Client = withSchema
        expectTypeOf(bareFromSchema).toEqualTypeOf<PimlicoClient.Client>()
    })
})
