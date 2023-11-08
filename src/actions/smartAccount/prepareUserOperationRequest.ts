import type { Chain, Client, Transport } from "viem"
import { estimateFeesPerGas } from "viem/actions"
import type { SmartAccount } from "../../accounts/types"
import type { BundlerActions } from "../../clients/decorators/bundler"
import type { GetAccountParameter, PartialBy, UserOperation } from "../../types"
import type { BundlerRpcSchema } from "../../types/bundler"
import { AccountOrClientNotFoundError, parseAccount } from "../../utils"

export type PrepareUserOperationRequestParameters<
    TAccount extends SmartAccount | undefined = SmartAccount | undefined
> = {
    userOperation: PartialBy<
        UserOperation,
        | "nonce"
        | "sender"
        | "initCode"
        | "callGasLimit"
        | "verificationGasLimit"
        | "preVerificationGas"
        | "maxFeePerGas"
        | "maxPriorityFeePerGas"
        | "paymasterAndData"
        | "signature"
    >
} & GetAccountParameter<TAccount>

export type PrepareUserOperationRequestReturnType = UserOperation

export async function prepareUserOperationRequest<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
    client: Client<TTransport, TChain, TAccount, BundlerRpcSchema, BundlerActions>,
    args: PrepareUserOperationRequestParameters<TAccount>
): Promise<PrepareUserOperationRequestReturnType> {
    const { account: account_ = client.account, userOperation: partialUserOperation } = args
    if (!account_) throw new AccountOrClientNotFoundError()

    const account = parseAccount(account_) as SmartAccount

    const [sender, nonce, initCode, signature, callData, paymasterAndData, gasEstimation] = await Promise.all([
        partialUserOperation.sender || account.address,
        partialUserOperation.nonce || account.getNonce(),
        partialUserOperation.initCode || account.getInitCode(),
        partialUserOperation.signature || account.getDummySignature(),
        partialUserOperation.callData,
        partialUserOperation.paymasterAndData || "0x",
        !partialUserOperation.maxFeePerGas || !partialUserOperation.maxPriorityFeePerGas
            ? estimateFeesPerGas(account.client)
            : undefined
    ])

    const userOperation: UserOperation = {
        sender,
        nonce,
        initCode,
        signature,
        callData,
        paymasterAndData,
        maxFeePerGas: partialUserOperation.maxFeePerGas || gasEstimation?.maxFeePerGas || 0n,
        maxPriorityFeePerGas: partialUserOperation.maxPriorityFeePerGas || gasEstimation?.maxPriorityFeePerGas || 0n,
        callGasLimit: partialUserOperation.callGasLimit || 0n,
        verificationGasLimit: partialUserOperation.verificationGasLimit || 0n,
        preVerificationGas: partialUserOperation.preVerificationGas || 0n
    }

    if (!userOperation.callGasLimit || !userOperation.verificationGasLimit || !userOperation.preVerificationGas) {
        const gasParameters = await client.estimateUserOperationGas({
            userOperation,
            entryPoint: account.entryPoint
        })

        userOperation.callGasLimit = userOperation.callGasLimit || gasParameters.callGasLimit
        userOperation.verificationGasLimit = userOperation.verificationGasLimit || gasParameters.verificationGasLimit
        userOperation.preVerificationGas = userOperation.preVerificationGas || gasParameters.preVerificationGas
    }

    return userOperation
}
