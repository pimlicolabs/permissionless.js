import type { PartialBy } from "viem/types/utils"
import { type StackupPaymasterClient } from "../../clients/stackup"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    EntryPoint,
    GetEntryPointVersion
} from "../../types/entrypoint"
import type { StackupPaymasterContext } from "../../types/stackup"
import type { UserOperation } from "../../types/userOperation"
import { deepHexlify } from "../../utils/deepHexlify"
import { getEntryPointVersion } from "../../utils/getEntryPointVersion"

export type SponsorUserOperationParameters<entryPoint extends EntryPoint> = {
    userOperation: entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE
        ? PartialBy<
              UserOperation<"v0.6">,
              "callGasLimit" | "preVerificationGas" | "verificationGasLimit"
          >
        : PartialBy<
              UserOperation<"v0.7">,
              | "callGasLimit"
              | "preVerificationGas"
              | "verificationGasLimit"
              | "paymasterVerificationGasLimit"
              | "paymasterPostOpGasLimit"
          >
    entryPoint: entryPoint
    context: StackupPaymasterContext
}

export type SponsorUserOperationReturnType<entryPoint extends EntryPoint> =
    UserOperation<GetEntryPointVersion<entryPoint>>

/**
 * Returns paymasterAndData & updated gas parameters required to sponsor a userOperation.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/stackup-paymaster-actions/sponsorUserOperation
 *
 * @param client {@link PimlicoBundlerClient} that you created using viem's createClient whose transport url is pointing to the Pimlico's bundler.
 * @param args {@link sponsorUserOperationParameters} UserOperation you want to sponsor & entryPoint.
 * @returns paymasterAndData & updated gas parameters, see {@link SponsorUserOperationReturnType}
 *
 *
 * @example
 * import { createClient } from "viem"
 * import { sponsorUserOperation } from "permissionless/actions/stackup"
 *
 * const bundlerClient = createClient({
 *      chain: goerli,
 *      transport: http("https://api.stackup.sh/v2/paymaster/YOUR_API_KEY_HERE")
 * })
 *
 * await sponsorUserOperation(bundlerClient, {
 *      userOperation: userOperationWithDummySignature,
 *      entryPoint: entryPoint
 * }})
 *
 */
export const sponsorUserOperation = async <entryPoint extends EntryPoint>(
    client: StackupPaymasterClient<entryPoint>,
    args: SponsorUserOperationParameters<entryPoint>
): Promise<SponsorUserOperationReturnType<entryPoint>> => {
    const response = await client.request({
        method: "pm_sponsorUserOperation",
        params: [deepHexlify(args.userOperation), args.entryPoint, args.context]
    })

    const entryPointVersion = getEntryPointVersion(args.entryPoint)

    const userOperation: SponsorUserOperationReturnType<entryPoint> = (
        entryPointVersion === "v0.6"
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
