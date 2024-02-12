import type { Account, Chain, Client, Transport } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { Prettify } from "../../types/"
import type {
    DefaultEntryPoint,
    EntryPoint,
    GetEntryPointVersion
} from "../../types/entrypoint"
import type { PimlicoPaymasterRpcSchema } from "../../types/pimlico"
import type {
    UserOperation,
    UserOperationWithBigIntAsHex
} from "../../types/userOperation"
import { deepHexlify } from "../../utils/deepHexlify"
import { getEntryPointVersion } from "../../utils/getEntryPointVersion"

export type PimlicoSponsorUserOperationParameters<
    entryPoint extends EntryPoint
> = {
    userOperation: GetEntryPointVersion<entryPoint> extends "0.6"
        ? PartialBy<
              UserOperation<"0.6">,
              "callGasLimit" | "preVerificationGas" | "verificationGasLimit"
          >
        : PartialBy<
              UserOperation<"0.7">,
              | "callGasLimit"
              | "preVerificationGas"
              | "verificationGasLimit"
              | "paymasterVerificationGasLimit"
              | "paymasterPostOpGasLimit"
          >
    entryPoint: entryPoint
    sponsorshipPolicyId?: string
}

export type SponsorUserOperationReturnType<entryPoint extends EntryPoint> =
    UserOperation<GetEntryPointVersion<entryPoint>>

/**
 * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/pimlico-paymaster-actions/sponsorUserOperation
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @param args {@link PimlicoSponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
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
    entryPoint extends EntryPoint = DefaultEntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>(
    client: Client<
        TTransport,
        TChain,
        TAccount,
        PimlicoPaymasterRpcSchema<entryPoint>
    >,
    args: Prettify<PimlicoSponsorUserOperationParameters<entryPoint>>
): Promise<Prettify<SponsorUserOperationReturnType<entryPoint>>> => {
    const response = await client.request({
        method: "pm_sponsorUserOperation",
        params: args.sponsorshipPolicyId
            ? [
                  deepHexlify(
                      args.userOperation
                  ) as UserOperationWithBigIntAsHex<
                      GetEntryPointVersion<entryPoint>
                  >,
                  args.entryPoint,
                  {
                      sponsorshipPolicyId: args.sponsorshipPolicyId
                  }
              ]
            : [
                  deepHexlify(
                      args.userOperation
                  ) as UserOperationWithBigIntAsHex<
                      GetEntryPointVersion<entryPoint>
                  >,
                  args.entryPoint
              ]
    })

    const entryPointVersion = getEntryPointVersion(args.entryPoint)

    const userOperation: SponsorUserOperationReturnType<entryPoint> = (
        entryPointVersion === "0.6"
            ? {
                  ...args.userOperation,
                  paymasterAndData: response.paymasterAndData,
                  preVerificationGas: BigInt(response.preVerificationGas),
                  verificationGasLimit: BigInt(response.verificationGasLimit),
                  callGasLimit: BigInt(response.callGasLimit)
              }
            : {
                  ...args.userOperation,
                  paymasterAndData: response.paymasterAndData,
                  preVerificationGas: BigInt(response.preVerificationGas),
                  verificationGasLimit: BigInt(response.verificationGasLimit),
                  callGasLimit: BigInt(response.callGasLimit),
                  paymasterVerificationGasLimit:
                      response.paymasterVerificationGasLimit
                          ? BigInt(response.paymasterVerificationGasLimit)
                          : undefined,
                  paymasterPostOpGasLimit: response.paymasterPostOpGasLimit
                      ? BigInt(response.paymasterPostOpGasLimit)
                      : undefined
              }
    ) as SponsorUserOperationReturnType<entryPoint>

    return userOperation
}
