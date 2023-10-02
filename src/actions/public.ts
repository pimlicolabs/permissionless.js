import type { Address, Chain, Client, Hex, PublicClient, Transport } from "viem"
import { BaseError, ContractFunctionRevertedError } from "viem"

export type GetSenderAddressParams = { initCode: Hex; entryPoint: Address }

export const getSenderAddress = async <
    TPublicClient extends PublicClient<Transport, Chain | undefined> = PublicClient<Transport, Chain | undefined>
>(
    publicClient: TPublicClient,
    { initCode, entryPoint }: GetSenderAddressParams
): Promise<Address> => {
    try {
        await publicClient.simulateContract({
            address: entryPoint,
            abi: [
                {
                    inputs: [
                        {
                            internalType: "address",
                            name: "sender",
                            type: "address"
                        }
                    ],
                    name: "SenderAddressResult",
                    type: "error"
                },
                {
                    inputs: [
                        {
                            internalType: "bytes",
                            name: "initCode",
                            type: "bytes"
                        }
                    ],
                    name: "getSenderAddress",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function"
                }
            ],
            functionName: "getSenderAddress",
            args: [initCode]
        })
    } catch (err) {
        if (err instanceof BaseError) {
            const revertError = err.walk((err) => err instanceof ContractFunctionRevertedError)
            if (revertError instanceof ContractFunctionRevertedError) {
                const errorName = revertError.data?.errorName ?? ""
                if (errorName === "SenderAddressResult" && revertError.data?.args && revertError.data?.args[0]) {
                    return revertError.data?.args[0] as Address
                }
            }
        }
        throw err
    }

    throw new Error("must handle revert")
}

export type PublicClientExtendedActions = {
    getSenderAddress: (args: GetSenderAddressParams) => Promise<Address>
}

export const publicClientExtendedActions = (client: Client): PublicClientExtendedActions => ({
    getSenderAddress: async (args: GetSenderAddressParams): Promise<Address> =>
        getSenderAddress(client as PublicClient, args)
})
