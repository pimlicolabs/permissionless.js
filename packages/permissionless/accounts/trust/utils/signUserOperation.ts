import type { Account, Address, Chain, Client, Transport } from "viem"
import type {
    EntryPoint,
    GetEntryPointVersion,
    UserOperation
} from "../../../types"
import { getUserOperationHash } from "../../../utils"
import { signMessage } from "./signMessage"

export const signUserOperation = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TClientAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TClientAccount>,
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
