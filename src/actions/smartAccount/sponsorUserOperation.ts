import type { Chain, Client, Hex, Transport } from "viem"
import { type SmartAccount } from "../../accounts/types.js"
import type { GetAccountParameter } from "../../types/index.js"
import type { UserOperation } from "../../types/userOperation.js"
import { getAction } from "../../utils/getAction.js"
import { parseAccount } from "../../utils/index.js"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA.js"
import { estimateUserOperationGas } from "../bundler/estimateUserOperationGas.js"

export type SponsorUserOperationParameters<TAccount extends SmartAccount | undefined = SmartAccount | undefined,> = {
    userOperation: UserOperation
} & GetAccountParameter<TAccount>

export type SponsorUserOperationReturnType = {
    paymasterAndData: Hex
    preVerificationGas: bigint
    verificationGasLimit: bigint
    callGasLimit: bigint
}

export async function sponsorUserOperation<TChain extends Chain | undefined, TAccount extends SmartAccount | undefined>(
    client: Client<Transport, TChain, TAccount>,
    args: SponsorUserOperationParameters<TAccount>
): Promise<SponsorUserOperationReturnType> {
    const { account: account_ = client.account, userOperation } = args
    if (!account_) throw new AccountOrClientNotFoundError()

    const account = parseAccount(account_) as SmartAccount

    let callGasLimit = userOperation.callGasLimit
    let verificationGasLimit = userOperation.verificationGasLimit
    let preVerificationGas = userOperation.preVerificationGas

    if (!userOperation.callGasLimit || !userOperation.verificationGasLimit || !userOperation.preVerificationGas) {
        const gasParameters = await getAction(
            client,
            estimateUserOperationGas
        )({
            userOperation,
            entryPoint: account.entryPoint
        })

        callGasLimit = callGasLimit || gasParameters.callGasLimit
        verificationGasLimit = verificationGasLimit || gasParameters.verificationGasLimit
        preVerificationGas = preVerificationGas || gasParameters.preVerificationGas
    }

    return {
        paymasterAndData: "0x",
        callGasLimit,
        verificationGasLimit,
        preVerificationGas
    }
}
