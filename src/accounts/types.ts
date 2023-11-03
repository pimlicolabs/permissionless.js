import type { Address, Hex, LocalAccount, PublicClient } from "viem"
import { Chain } from "viem"
import { Transport } from "viem"

export type SmartAccount<
    Name extends string = string,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = LocalAccount<Name> & {
    publicCLient: PublicClient<transport, chain>
    entryPoint: Address
    getNonce: () => Promise<bigint>
    getInitCode: () => Promise<Hex>
    encodeCallData: ({ to, value, data }: { to: Address; value: bigint; data: Hex }) => Promise<Hex>
    getDummySignature(): Promise<Hex>
}
