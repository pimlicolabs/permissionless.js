import type { Account, Address, Chain, Client, Hex, Transport } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { PimlicoPaymasterRpcSchema } from "../../types/pimlico.js"
import type {
    UserOperation,
    UserOperationWithBigIntAsHex
} from "../../types/userOperation.js"
import { deepHexlify } from "../../utils/deepHexlify.js"

export type SponsorUserOperationParameters = {
    userOperation: PartialBy<
        UserOperation,
        | "callGasLimit"
        | "preVerificationGas"
        | "verificationGasLimit"
        | "paymasterAndData"
    >
    entryPoint: Address
}

export type SponsorUserOperationReturnType = {
    paymasterAndData: Hex
    preVerificationGas: bigint
    verificationGasLimit: bigint
    callGasLimit: bigint
}

/**
 * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-paymaster-actions/sponsorUserOperation
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @param args {@link sponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
 * @returns paymasterAndData & updated gas parameters, see {@link SponsorUserOperationReturnType}
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sponsorUserOperation } from "permissionless/actions/pimlico"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.pimlico.io/v2/goerli/rpc?apikey=YOUR_API_KEY_HERE")
 * })
 *
 * await sponsorUserOperation(bundlerClient, {
 *      userOperation: userOperationWithDummySignature,
 *      entryPoint: entryPoint
 * }})
 *
 */
export const sponsorUserOperation = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<TTransport, TChain, TAccount, PimlicoPaymasterRpcSchema>,
    args: SponsorUserOperationParameters
): Promise<SponsorUserOperationReturnType> => {
    const response = await client.request({
        method: "pm_sponsorUserOperation",
        params: [
            deepHexlify(args.userOperation) as UserOperationWithBigIntAsHex,
            args.entryPoint
        ]
    })

    return {
        paymasterAndData: response.paymasterAndData,
        preVerificationGas: BigInt(response.preVerificationGas),
        verificationGasLimit: BigInt(response.verificationGasLimit),
        callGasLimit: BigInt(response.callGasLimit)
    }
}
