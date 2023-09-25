import { UserOperation } from "./types"
import type { Address } from "abitype"
import { Account, Chain, Client, Hash, Transport } from "viem"

export type sendUserOperationParameters = {
    userOperation: UserOperation
    entryPointAddress: Address
}

type BundlerRpcSchema = [
    {
        Method: "eth_sendUserOperation"
        Parameters: [userOperation: UserOperation, entryPointAddress: Address]
        ReturnType: Hash
    }
]

export type BundlerClient = Client<Transport, Chain, Account, BundlerRpcSchema>

export const sendUserOperation = (client: BundlerClient, args: sendUserOperationParameters) => {
    return client.request({
        method: "eth_sendUserOperation",
        params: [args.userOperation, args.entryPointAddress]
    })
}

export default (client: Client) => ({
    sendUserOperation: (args: sendUserOperationParameters) => sendUserOperation(client as BundlerClient, args)
})
