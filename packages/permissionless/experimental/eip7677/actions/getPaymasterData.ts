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
    GetRpcPaymasterDataReturnType
} from "../types/paymaster"

export type GetPaymasterDataParameters<
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

export type GetPaymasterDataReturnType<
    entryPointVersion extends "0.6" | "0.7"
> = entryPointVersion extends "0.6"
    ? {
          paymasterAndData: Hex
      }
    : {
          paymaster: Hex
          paymasterData: Hex
      }

export async function getPaymasterData<
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
    }: GetPaymasterDataParameters<
        entryPointAddress,
        entryPointVersion,
        TChain,
        TChainOverride
    >
): Promise<GetPaymasterDataReturnType<entryPointVersion>> {
    const chainId = chain?.id ?? client.chain?.id

    if (!chainId) {
        throw new ChainNotFoundError()
    }

    const response = await client.request({
        method: "pm_getPaymasterData",
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
        const responseV06 = response as GetRpcPaymasterDataReturnType<"0.6">

        return {
            paymasterAndData: responseV06.paymasterAndData
        } as GetPaymasterDataReturnType<entryPointVersion>
    }

    const responseV07 = response as GetRpcPaymasterDataReturnType<"0.7">

    return {
        paymaster: responseV07.paymaster,
        paymasterData: responseV07.paymasterData
    } as GetPaymasterDataReturnType<entryPointVersion>
}
