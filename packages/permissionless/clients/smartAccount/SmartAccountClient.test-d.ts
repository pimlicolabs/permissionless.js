import {
    type SafeSmartAccount,
    type SimpleSmartAccount,
    SmartAccountClient,
    smartAccountActions
} from "permissionless"
import type { PimlicoClient } from "permissionless/pimlico"
import { type Chain, type Client, http, type Transport } from "viem"
import { sepolia } from "viem/chains"
import type {
    Actions,
    BundlerClient,
    PaymasterClient,
    SmartAccount
} from "viem/erc4337"
import type { Address, Authorization, Hex, RpcSchema } from "viem/utils"
import { describe, expectTypeOf, test } from "vitest"

declare const safeAccount: SafeSmartAccount.ReturnType
declare const simple7702Account: SimpleSmartAccount.ReturnType<"0.8", true>
declare const publicClient: Client.Client<typeof sepolia>
declare const pimlicoClient: ReturnType<typeof PimlicoClient.create>
declare const authorization: Authorization.Signed
declare const address: Address.Address

type CustomSchema = RpcSchema.From<{
    Request: { method: "custom_method"; params: [value: string] }
    ReturnType: string
}>
declare const withSchema: SmartAccountClient.Client<
    Transport.Transport,
    typeof sepolia,
    SafeSmartAccount.ReturnType,
    undefined,
    CustomSchema
>

const bundlerTransport = http("https://bundler.invalid")

describe("SmartAccountClient", () => {
    test("namespace names", () => {
        expectTypeOf<
            keyof typeof SmartAccountClient
        >().toEqualTypeOf<"create">()
        expectTypeOf<SmartAccountClient.Client>().not.toBeAny()
        expectTypeOf<SmartAccountClient.Config>().not.toBeAny()
        expectTypeOf<SmartAccountClient.Actions>().not.toBeAny()
        expectTypeOf<SmartAccountClient.PrepareUserOperationHook>().not.toBeAny()
    })

    test("create resolves account and chain precisely", () => {
        const client = SmartAccountClient.create({
            account: safeAccount,
            chain: sepolia,
            bundlerTransport
        })
        expectTypeOf(client).toEqualTypeOf<
            SmartAccountClient.Client<
                typeof bundlerTransport,
                typeof sepolia,
                SafeSmartAccount.ReturnType,
                undefined,
                never
            >
        >()
        expectTypeOf(
            client.account
        ).toEqualTypeOf<SafeSmartAccount.ReturnType>()
        expectTypeOf(client.chain).toEqualTypeOf<typeof sepolia>()
        expectTypeOf(client.client).toEqualTypeOf<undefined>()
    })

    test("chain falls back to the public client's chain", () => {
        const client = SmartAccountClient.create({
            account: safeAccount,
            client: publicClient,
            bundlerTransport
        })
        expectTypeOf(client.chain).toEqualTypeOf<typeof sepolia>()
        expectTypeOf(client.client).toEqualTypeOf<
            Client.Client<typeof sepolia>
        >()
    })

    test("config accepts the bundler client's options and the hooks", () => {
        expectTypeOf<SmartAccountClient.Config>().toHaveProperty(
            "bundlerTransport"
        )
        expectTypeOf<SmartAccountClient.Config["paymaster"]>().toEqualTypeOf<
            BundlerClient.Paymaster | PaymasterClient.Decorator | undefined
        >()
        expectTypeOf<
            NonNullable<SmartAccountClient.Config["userOperation"]>
        >().toHaveProperty("estimateFeesPerGas")
        expectTypeOf<
            NonNullable<SmartAccountClient.Config["userOperation"]>
        >().toHaveProperty("prepareUserOperation")
        expectTypeOf(SmartAccountClient.create).toBeCallableWith({
            account: safeAccount,
            chain: sepolia,
            bundlerTransport,
            paymaster: pimlicoClient,
            paymasterContext: { sponsorshipPolicyId: "sp_x" },
            userOperation: {
                estimateFeesPerGas: async () =>
                    (await pimlicoClient.getUserOperationGasPrice()).fast
            }
        })
        expectTypeOf(SmartAccountClient.create).toBeCallableWith({
            account: safeAccount,
            chain: sepolia,
            bundlerTransport,
            paymaster: true
        })
    })

    test("PrepareUserOperationHook is viem's prepare signature", () => {
        expectTypeOf<SmartAccountClient.PrepareUserOperationHook>().toEqualTypeOf<
            (
                client: BundlerClient.Client,
                parameters: Actions.userOperation.prepare.Options
            ) => Promise<Actions.userOperation.prepare.ReturnType>
        >()
    })

    test("client carries viem's account-abstraction actions and ours", () => {
        const client = SmartAccountClient.create({
            account: safeAccount,
            chain: sepolia,
            bundlerTransport
        })
        expectTypeOf(
            client.userOperation.send
        ).returns.resolves.toEqualTypeOf<Hex.Hex>()
        expectTypeOf(client.userOperation.prepare).toBeFunction()
        expectTypeOf(client.userOperation.estimateGas).toBeFunction()
        expectTypeOf(client.userOperation.waitForReceipt).toBeFunction()
        expectTypeOf(
            client.sendTransaction
        ).returns.resolves.toEqualTypeOf<Hex.Hex>()
        expectTypeOf(client.writeContract).toBeFunction()
        expectTypeOf(
            client.signMessage
        ).returns.resolves.toEqualTypeOf<Hex.Hex>()
        expectTypeOf(client.signTypedData).toBeFunction()
        expectTypeOf(client.sendCalls).toBeFunction()
        expectTypeOf(client.getCallsStatus).toBeFunction()
        expectTypeOf<
            keyof SmartAccountClient.Actions<
                typeof sepolia,
                SafeSmartAccount.ReturnType
            >
        >().toEqualTypeOf<
            | "sendTransaction"
            | "signMessage"
            | "signTypedData"
            | "writeContract"
            | "sendCalls"
            | "getCallsStatus"
        >()
        expectTypeOf(smartAccountActions(client)).toEqualTypeOf<
            SmartAccountClient.Actions<
                typeof sepolia,
                SafeSmartAccount.ReturnType
            >
        >()
    })

    test("send options follow the account's EntryPoint version", () => {
        const client = SmartAccountClient.create({
            account: safeAccount,
            chain: sepolia,
            bundlerTransport
        })
        client.userOperation.send({ calls: [{ to: address, value: 0n }] })
        client.userOperation.send({
            callData: "0x",
            paymaster: pimlicoClient.paymaster
        })
        client.userOperation.prepare({
            calls: [{ to: address }],
            factory: address,
            factoryData: "0x"
        })
        // Safe rides EntryPoint 0.7: viem types `authorization` on 0.8+ only.
        // @ts-expect-error
        client.userOperation.send({ calls: [{ to: address }], authorization })
    })

    test("authorization is accepted on EntryPoint 0.8 accounts", () => {
        const client = SmartAccountClient.create({
            account: simple7702Account,
            chain: sepolia,
            bundlerTransport
        })
        client.userOperation.send({ calls: [{ to: address }], authorization })
        client.userOperation.prepare({
            calls: [{ to: address }],
            authorization
        })
    })
})

// #500: an instance assigned to the bare alias must ride the alias-identity fast
// path, both as a plain assignment and as a generic call with a contextual return
// type (the issue's `useQuery<SmartAccountClient>(() => create(...))` shape).
describe("SmartAccountClient alias identity (#500)", () => {
    const precise = SmartAccountClient.create({
        account: safeAccount,
        chain: sepolia,
        bundlerTransport,
        paymaster: pimlicoClient,
        userOperation: {
            estimateFeesPerGas: async () =>
                (await pimlicoClient.getUserOperationGasPrice()).fast
        }
    })

    test("precise instance assigns to the bare alias", () => {
        const bare: SmartAccountClient.Client = precise
        expectTypeOf(bare).toEqualTypeOf<SmartAccountClient.Client>()
        expectTypeOf(
            precise.account
        ).toEqualTypeOf<SafeSmartAccount.ReturnType>()
    })

    test("generic call with a contextual bare-alias return type", () => {
        function useQuery<data>(fn: () => data): data {
            return fn()
        }
        const fromQuery = useQuery<SmartAccountClient.Client>(() =>
            SmartAccountClient.create({
                account: safeAccount,
                chain: sepolia,
                bundlerTransport,
                paymaster: pimlicoClient
            })
        )
        expectTypeOf(fromQuery).toEqualTypeOf<SmartAccountClient.Client>()
    })

    test("a custom rpc schema still assigns to the bare alias", () => {
        const bare: SmartAccountClient.Client = withSchema
        expectTypeOf(bare).toEqualTypeOf<SmartAccountClient.Client>()
    })

    test("the bare alias keeps its slots", () => {
        expectTypeOf<SmartAccountClient.Client["account"]>().toEqualTypeOf<
            SmartAccount.SmartAccount | undefined
        >()
        expectTypeOf<SmartAccountClient.Client["client"]>().toEqualTypeOf<
            Client.Client | undefined
        >()
        expectTypeOf<SmartAccountClient.Client["chain"]>().toEqualTypeOf<
            Chain.Chain | undefined
        >()
    })
})
