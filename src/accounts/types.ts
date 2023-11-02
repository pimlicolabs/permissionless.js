import type { Address, Hex, LocalAccount } from "viem"

export type SmartAccount<Name extends string = string> = LocalAccount<Name> & {
    entryPoint: Address
    getNonce: () => Promise<bigint>
    getInitCode: () => Promise<Hex>
    encodeCallData: ({ to, value, data }: { to: Address; value: bigint; data: Hex }) => Promise<Hex>
    getDummySignature(): Promise<Hex>
}
