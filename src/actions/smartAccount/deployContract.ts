import {
    type Abi,
    type Chain,
    type Client,
    type DeployContractParameters,
    type DeployContractReturnType,
    type Transport
} from "viem"
import type { SmartAccount } from "../../accounts/types.js"
import type { BundlerActions } from "../../clients/decorators/bundler.js"
import type { BundlerRpcSchema } from "../../types/bundler.js"
import { parseAccount } from "../../utils/index.js"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA.js"
import { sendUserOperation } from "./sendUserOperation.js"

export async function deployContract<
    const TAbi extends Abi | readonly unknown[],
    TChain extends Chain | undefined,
    TAccount extends SmartAccount | undefined,
    TChainOverride extends Chain | undefined
>(
    client: Client<Transport, TChain, TAccount, BundlerRpcSchema, BundlerActions>,
    { abi, args, bytecode, ...request }: DeployContractParameters<TAbi, TChain, TAccount, TChainOverride>
): Promise<DeployContractReturnType> {
    const { account: account_ = client.account } = request

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount

    const userOpHash = await sendUserOperation(client, {
        userOperation: {
            sender: account.address,
            paymasterAndData: "0x",
            maxFeePerGas: request.maxFeePerGas || 0n,
            maxPriorityFeePerGas: request.maxPriorityFeePerGas || 0n,
            callData: await account.encodeDeployCallData({
                abi,
                args,
                bytecode
            } as unknown as DeployContractParameters<TAbi, TChain, TAccount, TChainOverride>)
        },
        account: account
    })

    const userOperationReceipt = await client.waitForUserOperationReceipt({
        hash: userOpHash
    })

    return userOperationReceipt?.receipt.transactionHash
}
