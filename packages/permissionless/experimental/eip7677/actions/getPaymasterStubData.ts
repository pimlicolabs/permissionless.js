import {
    type Account,
    type Chain,
    ChainNotFoundError,
    type Client,
    type GetChainParameter,
    type Hex,
    type Transport,
    toHex
} from "viem"
import type {
    UserOperation,
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
import { deepHexlify } from "../../../utils"
import type {
    Eip7677RpcSchema,
    GetRpcPaymasterStubDataReturnType
} from "../types/paymaster"

export type GetPaymasterStubDataParameters<
    entryPointAddress extends
        | typeof entryPoint06Address
        | typeof entryPoint07Address,
    entryPointVersion extends "0.6" | "0.7",
    TChain extends Chain | undefined,
    TChainOverride extends Chain | undefined
> = {
    userOperation: UserOperation<entryPointVersion>
    entryPoint: {
        address: entryPointAddress
        version: entryPointVersion
    }
    context?: Record<string, unknown>
} & GetChainParameter<TChain, TChainOverride>

export type GetPaymasterStubDataReturnType<
    entryPointVersion extends "0.6" | "0.7"
> = entryPointVersion extends "0.6"
    ? {
          paymasterAndData: Hex
          sponsor?: { name: string; icon?: string }
          isFinal?: boolean
      }
    : {
          paymaster: Hex
          paymasterData: Hex
          paymasterVerificationGasLimit?: bigint
          paymasterPostOpGasLimit?: bigint
          sponsor?: { name: string; icon?: string }
          isFinal?: boolean
      }

export async function getPaymasterStubData<
    entryPointAddress extends
        | typeof entryPoint06Address
        | typeof entryPoint07Address,
    entryPointVersion extends "0.6" | "0.7",
    TChain extends Chain | undefined,
    TChainOverride extends Chain | undefined
>(
    client: Client<
        Transport,
        TChain,
        Account | undefined,
        Eip7677RpcSchema<entryPointVersion>
    >,
    {
        userOperation,
        entryPoint,
        context,
        chain
    }: GetPaymasterStubDataParameters<
        entryPointAddress,
        entryPointVersion,
        TChain,
        TChainOverride
    >
): Promise<GetPaymasterStubDataReturnType<entryPointVersion>> {
    const chainId = chain?.id ?? client.chain?.id

    if (!chainId) {
        throw new ChainNotFoundError()
    }

    const response = await client.request({
        method: "pm_getPaymasterStubData",
        params: context
            ? [
                  deepHexlify(userOperation),
                  entryPoint.address,
                  toHex(chainId),
                  context
              ]
            : [deepHexlify(userOperation), entryPoint.address, toHex(chainId)]
    })

    if (entryPoint.version === "0.6") {
        const responseV06 = response as GetRpcPaymasterStubDataReturnType<"0.6">

        return {
            paymasterAndData: responseV06.paymasterAndData,
            sponsor: responseV06.sponsor,
            isFinal: responseV06.isFinal
        } as GetPaymasterStubDataReturnType<entryPointVersion>
    }

    const responseV07 = response as GetRpcPaymasterStubDataReturnType<"0.7">

    return {
        paymaster: responseV07.paymaster,
        paymasterData: responseV07.paymasterData,
        paymasterVerificationGasLimit: responseV07.paymasterVerificationGasLimit
            ? BigInt(responseV07.paymasterVerificationGasLimit)
            : undefined,
        paymasterPostOpGasLimit: responseV07.paymasterPostOpGasLimit
            ? BigInt(responseV07.paymasterPostOpGasLimit)
            : undefined,
        sponsor: responseV07.sponsor,
        isFinal: responseV07.isFinal
    } as GetPaymasterStubDataReturnType<entryPointVersion>
}
