import type { Chain, Client, SendTransactionParameters, SendTransactionReturnType, Transport } from "viem"
import { type Hex } from "viem"
import { estimateFeesPerGas } from "viem/actions"
import { type SmartAccount } from "../../accounts/types.js"
import { type BundlerActions } from "../../clients/decorators/bundler.js"
import { type BundlerRpcSchema } from "../../types/bundler.js"
import { type UserOperation } from "../../types/index.js"
import { AccountOrClientNotFoundError, getUserOperationHash, parseAccount } from "../../utils/index.js"

export async function sendTransaction<
    TChain extends Chain | undefined,
    TAccount extends SmartAccount | undefined,
    TChainOverride extends Chain | undefined
>(
    client: Client<Transport, TChain, TAccount, BundlerRpcSchema, BundlerActions>,
    args: SendTransactionParameters<TChain, TAccount, TChainOverride>
): Promise<SendTransactionReturnType> {
    const { account: account_ = client.account, data, maxFeePerGas, maxPriorityFeePerGas, to, value } = args

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount

    if (!to) throw new Error("Missing to address")

    if (account.type !== "local") {
        throw new Error("RPC account type not supported")
    }

    const gasEstimation = await estimateFeesPerGas(account.client)

    const userOperation: UserOperation = {
        sender: account.address,
        nonce: await account.getNonce(),
        initCode: await account.getInitCode(),
        callData: await account.encodeCallData({
            to,
            value: value || 0n,
            data: data || "0x"
        }),
        paymasterAndData: "0x" as Hex,
        signature: await account.getDummySignature(),
        maxFeePerGas: maxFeePerGas || gasEstimation.maxFeePerGas || 0n,
        maxPriorityFeePerGas: maxPriorityFeePerGas || gasEstimation.maxPriorityFeePerGas || 0n,
        callGasLimit: 0n,
        verificationGasLimit: 0n,
        preVerificationGas: 0n
    }

    const gasParameters = await client.estimateUserOperationGas({
        userOperation,
        entryPoint: account.entryPoint
    })

    userOperation.callGasLimit = gasParameters.callGasLimit
    userOperation.verificationGasLimit = gasParameters.verificationGasLimit
    userOperation.preVerificationGas = gasParameters.preVerificationGas

    userOperation.signature = await account.signMessage({
        message: {
            raw: getUserOperationHash({
                userOperation,
                entryPoint: account.entryPoint,
                chainId: await client.chainId()
            })
        }
    })

    const userOpHash = await client.sendUserOperation({
        userOperation: userOperation,
        entryPoint: account.entryPoint
    })

    const userOperationReceipt = await client.waitForUserOperationReceipt({
        hash: userOpHash
    })

    return userOperationReceipt?.receipt.transactionHash
}
