import type { Account, Address, Chain, Client, Hash, Hex, Transport } from "viem"
import { type BasePaymasterRpcSchema } from "../../types/base.js"
import { type UserOperation } from "../../types/userOperation.js"

export type GetPaymasterAndDataForEstimateGasParameters = {
    userOperation: UserOperation
    entryPoint: Address
    chainId: Hex
}

export type GetPaymasterAndDataForEstimateGasReturnType = Hash

export const getPaymasterAndDataForEstimateGas = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, BasePaymasterRpcSchema>,
    args: GetPaymasterAndDataForEstimateGasParameters
): Promise<GetPaymasterAndDataForEstimateGasReturnType> => {
    const response = await client.request({
        method: "eth_paymasterAndDataForEstimateGas",
        params: [args.userOperation, args.entryPoint, args.chainId]
    })

    return response
}
