import {
    type Abi,
    type Address,
    BaseError,
    type Client,
    type Hex,
    type LocalAccount
} from "viem"
import type {
    Chain,
    CustomSource,
    EncodeDeployDataParameters,
    SignableMessage,
    Transport,
    TypedDataDefinition
} from "viem"
import { toAccount } from "viem/accounts"
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

export function toSmartAccount<
    TAccountSource extends CustomSource,
    TEntryPoint extends EntryPoint,
    TSource extends string = string,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
    TAbi extends Abi | readonly unknown[] = Abi
>({
    address,
    client,
    source,
    entryPoint,
    getNonce,
    getInitCode,
    getFactory,
    getFactoryData,
    encodeCallData,
    getDummySignature,
    encodeDeployCallData,
    signUserOperation,
    signMessage,
    signTypedData
}: TAccountSource & {
    source: TSource
    client: Client<transport, chain>
    entryPoint: TEntryPoint
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
        userOperation: UserOperation<GetEntryPointVersion<TEntryPoint>>
    ): Promise<Hex>
    encodeDeployCallData: ({
        abi,
        args,
        bytecode
    }: EncodeDeployDataParameters<TAbi>) => Promise<Hex>
    signUserOperation: (
        userOperation: UserOperation<GetEntryPointVersion<TEntryPoint>>
    ) => Promise<Hex>
}): SmartAccount<TEntryPoint, TSource, transport, chain, TAbi> {
    const account = toAccount({
        address: address,
        signMessage: ({ message }: { message: SignableMessage }) => {
            return signMessage({ message })
        },
        signTypedData: async (typedData) => {
            return signTypedData(typedData as TypedDataDefinition)
        },
        async signTransaction(_, __) {
            throw new SignTransactionNotSupportedBySmartAccount()
        }
    })

    return {
        ...account,
        source,
        client,
        entryPoint,
        publicKey: address,
        getNonce,
        getInitCode,
        getFactory,
        getFactoryData,
        encodeCallData,
        getDummySignature,
        encodeDeployCallData,
        signUserOperation
    } as SmartAccount<TEntryPoint, TSource, transport, chain, TAbi>
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
