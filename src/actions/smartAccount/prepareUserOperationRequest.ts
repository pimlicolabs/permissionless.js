import type { Address, Chain, Client, Transport } from "viem"
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
    }) => Promise<UserOperation>
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

    const [sender, nonce, initCode, callData, gasEstimation] =
        await Promise.all([
            partialUserOperation.sender || account.address,
            partialUserOperation.nonce || account.getNonce(),
            partialUserOperation.initCode || account.getInitCode(),
            partialUserOperation.callData,
            !partialUserOperation.maxFeePerGas ||
            !partialUserOperation.maxPriorityFeePerGas
                ? estimateFeesPerGas(account.client)
                : undefined
        ])

    let userOperation: UserOperation = {
        sender,
        nonce,
        initCode,
        callData,
        paymasterAndData: "0x",
        signature: partialUserOperation.signature || "0x",
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

    if (userOperation.signature === "0x") {
        userOperation.signature = await account.getDummySignature(userOperation)
    }

    if (sponsorUserOperation) {
        userOperation = await sponsorUserOperation({
            userOperation,
            entryPoint: account.entryPoint
        })
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
