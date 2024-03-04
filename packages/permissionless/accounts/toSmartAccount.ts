import {
    type Abi,
    type Address,
    type Chain,
    type Client,
    type CustomSource,
    type EncodeDeployDataParameters,
    type Hex,
    type SignableMessage,
    type Transport,
    type TypedDataDefinition,
    concat,
    encodeAbiParameters
} from "viem"
import { toAccount } from "viem/accounts"
import type { UserOperation } from "../types"
import type { EntryPoint, GetEntryPointVersion } from "../types/entrypoint"
import { isSmartAccountDeployed } from "../utils"
import {
    SignTransactionNotSupportedBySmartAccount,
    type SmartAccount
} from "./types"

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
        signMessage: async ({ message }: { message: SignableMessage }) => {
            const isDeployed = await isSmartAccountDeployed(client, address)
            if (isDeployed) return signMessage({ message })

            const signature = await signMessage({ message })

            const magicBytes =
                "0x6492649264926492649264926492649264926492649264926492649264926492"

            const abiEncodedMessage = encodeAbiParameters(
                [
                    {
                        type: "address",
                        name: "create2Factory"
                    },
                    {
                        type: "bytes",
                        name: "factoryCalldata"
                    },
                    {
                        type: "bytes",
                        name: "originalERC1271Signature"
                    }
                ],
                [
                    (await getFactory()) ?? "0x", // "0x should never happen if it's deployed"
                    (await getFactoryData()) ?? "0x", // "0x should never happen if it's deployed"
                    signature
                ]
            )

            return concat([abiEncodedMessage, magicBytes])
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
