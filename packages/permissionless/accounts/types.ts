import {
    type Abi,
    type Address,
    BaseError,
    type Client,
    type Hex,
    type LocalAccount
} from "viem"
import type { Chain, EncodeDeployDataParameters, Transport } from "viem"
import type { UserOperation } from "../types"
import type { EntryPoint, GetEntryPointVersion } from "../types/entrypoint"

export class SignTransactionNotSupportedBySmartAccount extends BaseError {
    override name = "SignTransactionNotSupportedBySmartAccount"
    constructor({ docsPath }: { docsPath?: string } = {}) {
        super(
            [
                "A smart account cannot sign or send transaction, it can only sign message or userOperation.",
                "Please send user operation instead."
            ].join("\n"),
            {
                docsPath,
                docsSlug: "account"
            }
        )
    }
}

export type SmartAccount<
    entryPoint extends EntryPoint,
    TSource extends string = string,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
    TAbi extends Abi | readonly unknown[] = Abi
> = LocalAccount<TSource> & {
    client: Client<transport, chain>
    entryPoint: entryPoint
    getNonce: () => Promise<bigint>
    getInitCode: () => Promise<Hex>
    getFactory: () => Promise<Address | undefined>
    getFactoryData: () => Promise<Hex | undefined>
    encodeCallData: (
        args:
            | {
                  to: Address
                  value: bigint
                  data: Hex
              }
            | {
                  to: Address
                  value: bigint
                  data: Hex
              }[]
    ) => Promise<Hex>
    getDummySignature(
        userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
    ): Promise<Hex>
    encodeDeployCallData: ({
        abi,
        args,
        bytecode
    }: EncodeDeployDataParameters<TAbi>) => Promise<Hex>
    signUserOperation: (
        userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
    ) => Promise<Hex>
}

export type SmartAccountSigner<
    TSource extends string = string,
    TAddress extends Address = Address
> = Omit<LocalAccount<TSource, TAddress>, "signTransaction">
