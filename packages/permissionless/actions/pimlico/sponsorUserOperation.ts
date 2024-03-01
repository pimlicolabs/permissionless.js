import type { Account, Address, Chain, Client, Hex, Transport } from "viem"
import type { PartialBy } from "viem/types/utils"
import type { Prettify } from "../../types/"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    EntryPoint,
    GetEntryPointVersion
} from "../../types/entrypoint"
import type { PimlicoPaymasterRpcSchema } from "../../types/pimlico"
import type {
    UserOperation,
    UserOperationWithBigIntAsHex
} from "../../types/userOperation"
import { deepHexlify } from "../../utils/deepHexlify"
import { ENTRYPOINT_ADDRESS_V06 } from "../../utils/getEntryPointVersion"

export type PimlicoSponsorUserOperationParameters<
    entryPoint extends EntryPoint
> = {
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
    sponsorshipPolicyId?: string
}

export type SponsorUserOperationReturnType<entryPoint extends EntryPoint> =
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE
        ? {
              callGasLimit: bigint
              verificationGasLimit: bigint
              preVerificationGas: bigint
              paymasterAndData: Hex
          }
        : {
              callGasLimit: bigint
              verificationGasLimit: bigint
              preVerificationGas: bigint
              paymaster: Address
              paymasterVerificationGasLimit: bigint
              paymasterPostOpGasLimit: bigint
              paymasterData: Hex
          }

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
    entryPoint extends EntryPoint,
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

    if (args.entryPoint === ENTRYPOINT_ADDRESS_V06) {
        const responseV06 = response as {
            paymasterAndData: Hex
            preVerificationGas: Hex
            verificationGasLimit: Hex
            callGasLimit: Hex
            paymaster?: never
            paymasterVerificationGasLimit?: never
            paymasterPostOpGasLimit?: never
            paymasterData?: never
        }
        return {
            paymasterAndData: responseV06.paymasterAndData,
            preVerificationGas: BigInt(responseV06.preVerificationGas),
            verificationGasLimit: BigInt(responseV06.verificationGasLimit),
            callGasLimit: BigInt(responseV06.callGasLimit)
        } as SponsorUserOperationReturnType<entryPoint>
    }

    const responseV07 = response as {
        preVerificationGas: Hex
        verificationGasLimit: Hex
        callGasLimit: Hex
        paymaster: Address
        paymasterVerificationGasLimit: Hex
        paymasterPostOpGasLimit: Hex
        paymasterData: Hex
        paymasterAndData?: never
    }

    return {
        callGasLimit: BigInt(responseV07.callGasLimit),
        verificationGasLimit: BigInt(responseV07.verificationGasLimit),
        preVerificationGas: BigInt(responseV07.preVerificationGas),
        paymaster: responseV07.paymaster,
        paymasterVerificationGasLimit: BigInt(
            responseV07.paymasterVerificationGasLimit
        ),
        paymasterPostOpGasLimit: BigInt(responseV07.paymasterPostOpGasLimit),
        paymasterData: responseV07.paymasterData
    } as SponsorUserOperationReturnType<entryPoint>
}
