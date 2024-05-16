import { getUserOperationHash } from "permissionless/utils"
import type { Account, Address, Chain, Client, Transport } from "viem"
import type {
    EntryPoint,
    GetEntryPointVersion,
    UserOperation
} from "../../../types"
import { signMessage } from "./signMessage"

export const signUserOperation = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, undefined>,
    {
        account,
        userOperation,
        entryPoint: entryPointAddress,
        chainId
    }: {
        account: Account | Address
        userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
        entryPoint: entryPoint
        chainId: number
    }
) => {
    return signMessage(client, {
        account: account,
        message: {
            raw: getUserOperationHash({
                userOperation,
                entryPoint: entryPointAddress,
                chainId: chainId
            })
        }
    })
}
