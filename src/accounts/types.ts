import {
    type Abi,
    type Address,
    BaseError,
    type Client,
    type Hex,
    type LocalAccount
} from "viem"
import type { Chain, EncodeDeployDataParameters, Transport } from "viem"
import { type UserOperation } from "../types/index.js"

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
    Name extends string = string,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = LocalAccount<Name> & {
    client: Client<transport, chain>
    entryPoint: Address
    getNonce: () => Promise<bigint>
    getInitCode: () => Promise<Hex>
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
    getDummySignature(userOperation: UserOperation): Promise<Hex>
    encodeDeployCallData: <TAbi extends Abi | readonly unknown[] = Abi>({
        abi,
        args,
        bytecode
    }: EncodeDeployDataParameters<TAbi>) => Promise<Hex>
    signUserOperation: (userOperation: UserOperation) => Promise<Hex>
}

export type SmartAccountSigner<
    TSource extends string = string,
    TAddress extends Address = Address
> = Omit<LocalAccount<TSource, TAddress>, "signTransaction">
