import type { Address, Chain, Client, Hex, Transport } from "viem"
import { estimateFeesPerGas } from "viem/actions"
import type { SmartAccount } from "../../accounts/types.js"
import type {
    GetAccountParameter,
    PartialBy,
    UserOperation
} from "../../types/index.js"
import { getAction } from "../../utils/getAction.js"
import {
    AccountOrClientNotFoundError,
    parseAccount
} from "../../utils/index.js"
import { estimateUserOperationGas } from "../bundler/estimateUserOperationGas.js"

export type SponsorUserOperationMiddleware = {
    sponsorUserOperation?: (args: {
        userOperation: UserOperation
        entryPoint: Address
    }) => Promise<{
        paymasterAndData: Hex
        preVerificationGas: bigint
        verificationGasLimit: bigint
        callGasLimit: bigint
    }>
}

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
} & GetAccountParameter<TAccount> &
    SponsorUserOperationMiddleware

export type PrepareUserOperationRequestReturnType = UserOperation

export async function prepareUserOperationRequest<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends SmartAccount | undefined = SmartAccount | undefined
>(
    client: Client<TTransport, TChain, TAccount>,
    args: PrepareUserOperationRequestParameters<TAccount>
): Promise<PrepareUserOperationRequestReturnType> {
    const {
        account: account_ = client.account,
        userOperation: partialUserOperation,
        sponsorUserOperation
    } = args
    if (!account_) throw new AccountOrClientNotFoundError()

    const account = parseAccount(account_) as SmartAccount

    const [sender, nonce, initCode, signature, callData, gasEstimation] =
        await Promise.all([
            partialUserOperation.sender || account.address,
            partialUserOperation.nonce || account.getNonce(),
            partialUserOperation.initCode || account.getInitCode(),
            partialUserOperation.signature || account.getDummySignature(),
            partialUserOperation.callData,
            !partialUserOperation.maxFeePerGas ||
            !partialUserOperation.maxPriorityFeePerGas
                ? estimateFeesPerGas(account.client)
                : undefined
        ])

    const userOperation: UserOperation = {
        sender,
        nonce,
        initCode,
        signature,
        callData,
        paymasterAndData: "0x",
        maxFeePerGas:
            partialUserOperation.maxFeePerGas ||
            gasEstimation?.maxFeePerGas ||
            0n,
        maxPriorityFeePerGas:
            partialUserOperation.maxPriorityFeePerGas ||
            gasEstimation?.maxPriorityFeePerGas ||
            0n,
        callGasLimit: partialUserOperation.callGasLimit || 0n,
        verificationGasLimit: partialUserOperation.verificationGasLimit || 0n,
        preVerificationGas: partialUserOperation.preVerificationGas || 0n
    }

    if (sponsorUserOperation) {
        const {
            callGasLimit,
            verificationGasLimit,
            preVerificationGas,
            paymasterAndData
        } = await sponsorUserOperation({
            userOperation,
            entryPoint: account.entryPoint
        })
        userOperation.paymasterAndData = paymasterAndData
        userOperation.callGasLimit = userOperation.callGasLimit || callGasLimit
        userOperation.verificationGasLimit =
            userOperation.verificationGasLimit || verificationGasLimit
        userOperation.preVerificationGas =
            userOperation.preVerificationGas || preVerificationGas
    } else if (
        !userOperation.callGasLimit ||
        !userOperation.verificationGasLimit ||
        !userOperation.preVerificationGas
    ) {
        const gasParameters = await getAction(
            client,
            estimateUserOperationGas
        )({
            userOperation: {
                ...userOperation
            },
            entryPoint: account.entryPoint
        })

        userOperation.callGasLimit =
            userOperation.callGasLimit || gasParameters.callGasLimit
        userOperation.verificationGasLimit =
            userOperation.verificationGasLimit ||
            gasParameters.verificationGasLimit
        userOperation.preVerificationGas =
            userOperation.preVerificationGas || gasParameters.preVerificationGas
    }

    return userOperation
}
