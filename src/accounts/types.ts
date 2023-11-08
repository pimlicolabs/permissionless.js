import type { Abi, Address, Client, GetConstructorArgs, Hex, LocalAccount } from "viem"
import type { Chain, Transport } from "viem"
import { type UserOperation } from "../types/index.js"

export type SmartAccount<
    Name extends string = string,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = LocalAccount<Name> & {
    client: Client<transport, chain>
    entryPoint: Address
    getNonce: () => Promise<bigint>
    getInitCode: () => Promise<Hex>
    encodeCallData: ({ to, value, data }: { to: Address; value: bigint; data: Hex }) => Promise<Hex>
    getDummySignature(): Promise<Hex>
    encodeDeployCallData: <TAbi extends Abi | readonly unknown[] = Abi>({
        abi,
        args,
        bytecode
    }: { abi: TAbi; bytecode: Hex } & GetConstructorArgs<TAbi>) => Promise<Hex>
    signUserOperation: (UserOperation: UserOperation) => Promise<Hex>
}
