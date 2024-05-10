import {
    type Address,
    type Chain,
    ChainNotFoundError,
    type Client,
    type GetChainParameter,
    type Hex,
    type Transport,
    toHex
} from "viem"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    EntryPoint,
    GetEntryPointVersion
} from "../../../types/entrypoint"
import type { UserOperationWithBigIntAsHex } from "../../../types/userOperation"
import { deepHexlify, getEntryPointVersion } from "../../../utils"
import type {
    Eip7677RpcSchema,
    GetRpcPaymasterStubDataReturnType
} from "../types/paymaster"

export type GetPaymasterStubDataParameters<
    TEntryPoint extends EntryPoint,
    TChain extends Chain | undefined,
    TChainOverride extends Chain | undefined = Chain | undefined
> = {
    userOperation: GetEntryPointVersion<TEntryPoint> extends "v0.6"
        ? {
              sender: Address
              nonce: bigint
              initCode: Hex
              callData: Hex
              callGasLimit: bigint
              verificationGasLimit: bigint
              preVerificationGas: bigint
              maxFeePerGas: bigint
              maxPriorityFeePerGas: bigint
              paymasterAndData?: Hex
              signature?: Hex
              factory?: never
              factoryData?: never
              paymaster?: never
              paymasterVerificationGasLimit?: never
              paymasterPostOpGasLimit?: never
              paymasterData?: never
          }
        : {
              sender: Address
              nonce: bigint
              factory?: Address
              factoryData?: Hex
              callData: Hex
              callGasLimit: bigint
              verificationGasLimit: bigint
              preVerificationGas: bigint
              maxFeePerGas: bigint
              maxPriorityFeePerGas: bigint
              paymaster?: Address
              paymasterData?: Hex
              signature?: Hex
              paymasterAndData?: never
              paymasterVerificationGasLimit?: bigint
              paymasterPostOpGasLimit?: bigint
          }
    entryPoint: TEntryPoint
    context?: Record<string, unknown>
} & GetChainParameter<TChain, TChainOverride>

export type GetPaymasterStubDataReturnType<TEntryPoint extends EntryPoint> =
    GetEntryPointVersion<TEntryPoint> extends "v0.6"
        ? {
              paymasterAndData: Hex
          }
        : {
              paymaster: Hex
              paymasterData: Hex
              paymasterVerificationGasLimit?: bigint
              paymasterPostOpGasLimit?: bigint
          }

export async function getPaymasterStubData<
    TEntryPoint extends EntryPoint,
    TChain extends Chain | undefined,
    TTransport extends Transport = Transport,
    TChainOverride extends Chain | undefined = Chain | undefined
>(
    client: Client<
        TTransport,
        TChain,
        undefined,
        Eip7677RpcSchema<TEntryPoint>
    >,
    {
        userOperation,
        entryPoint,
        context,
        chain
    }: GetPaymasterStubDataParameters<TEntryPoint, TChain, TChainOverride>
): Promise<GetPaymasterStubDataReturnType<TEntryPoint>> {
    const chainId = chain?.id ?? client.chain?.id

    if (!chainId) {
        throw new ChainNotFoundError()
    }

    const params:
        | [
              UserOperationWithBigIntAsHex<GetEntryPointVersion<TEntryPoint>>,
              TEntryPoint,
              Hex,
              Record<string, unknown>
          ]
        | [
              UserOperationWithBigIntAsHex<GetEntryPointVersion<TEntryPoint>>,
              TEntryPoint,
              Hex
          ] = context
        ? [
              deepHexlify(userOperation) as UserOperationWithBigIntAsHex<
                  GetEntryPointVersion<TEntryPoint>
              >,
              entryPoint,
              toHex(chainId),
              context
          ]
        : [
              deepHexlify(userOperation) as UserOperationWithBigIntAsHex<
                  GetEntryPointVersion<TEntryPoint>
              >,
              entryPoint,
              toHex(chainId)
          ]

    const response = await client.request({
        method: "pm_getPaymasterStubData",
        params
    })

    const entryPointVersion = getEntryPointVersion(entryPoint)

    if (entryPointVersion === "v0.6") {
        const responseV06 =
            response as GetRpcPaymasterStubDataReturnType<ENTRYPOINT_ADDRESS_V06_TYPE>

        return {
            paymasterAndData: responseV06.paymasterAndData
        } as GetPaymasterStubDataReturnType<TEntryPoint>
    }

    const responseV07 =
        response as GetRpcPaymasterStubDataReturnType<ENTRYPOINT_ADDRESS_V07_TYPE>

    return {
        paymaster: responseV07.paymaster,
        paymasterData: responseV07.paymasterData,
        paymasterVerificationGasLimit: responseV07.paymasterVerificationGasLimit
            ? BigInt(responseV07.paymasterVerificationGasLimit)
            : undefined,
        paymasterPostOpGasLimit: responseV07.paymasterPostOpGasLimit
            ? BigInt(responseV07.paymasterPostOpGasLimit)
            : undefined
    } as GetPaymasterStubDataReturnType<TEntryPoint>
}
