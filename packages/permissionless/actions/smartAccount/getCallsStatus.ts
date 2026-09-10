import { Actions, type Chain } from "viem"
import {
    type BundlerClient,
    Actions as Erc4337Actions,
    type SmartAccount
} from "viem/erc4337"
import type { Hex } from "viem/utils"
import { getAction } from "../../utils/getAction.js"

const getStatus = (statusCode: number) => {
    if (statusCode >= 100 && statusCode < 200)
        return ["pending", statusCode] as const
    if (statusCode >= 200 && statusCode < 300)
        return ["success", statusCode] as const
    if (statusCode >= 300 && statusCode < 700)
        return ["failure", statusCode] as const
    return [undefined, statusCode] as const
}

export async function getCallsStatus<
    account extends SmartAccount.SmartAccount | undefined,
    chain extends Chain.Chain | undefined
>(
    client: BundlerClient.Client<chain, account>,
    args: Actions.wallet.getCallsStatus.Options
): Promise<Actions.wallet.getCallsStatus.ReturnType> {
    const userOperationHash = args.id as Hex.Hex

    const chainId =
        client.chain?.id ??
        client.account?.client.chain?.id ??
        getAction(client, Actions.chains.getId, "chains.getId")(undefined)

    try {
        const receipt = await getAction(
            client,
            Erc4337Actions.userOperation.getReceipt,
            "userOperation.getReceipt"
        )({
            hash: userOperationHash
        })

        const [status, statusCode] = getStatus(receipt.success ? 200 : 500)

        return {
            id: userOperationHash,
            version: "1.0",
            chainId: await chainId,
            status,
            statusCode,
            atomic: true,
            receipts: [
                {
                    status: receipt.receipt.status,
                    logs: receipt.receipt.logs,
                    blockHash: receipt.receipt.blockHash,
                    blockNumber: receipt.receipt.blockNumber,
                    gasUsed: receipt.receipt.gasUsed,
                    transactionHash: receipt.receipt.transactionHash
                }
            ]
        }
    } catch {
        const [status, statusCode] = getStatus(100)

        return {
            id: userOperationHash,
            version: "1.0",
            chainId: await chainId,
            atomic: true,
            status,
            statusCode,
            receipts: []
        }
    }
}
