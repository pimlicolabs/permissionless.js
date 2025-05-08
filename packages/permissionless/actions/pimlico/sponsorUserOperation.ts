import type {
    Account,
    Address,
    Chain,
    Client,
    Hex,
    OneOf,
    PartialBy,
    Transport
} from "viem"
import type { EntryPointVersion, UserOperation } from "viem/account-abstraction"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"
import { deepHexlify } from "../../utils/deepHexlify.js"

type PaymasterContext = {
    sponsorshipPolicyId?: string
    validForSeconds?: number
    meta?: Record<string, string>
    [key: string]: unknown
}

export type PimlicoSponsorUserOperationParameters<
    entryPointVersion extends EntryPointVersion
> = {
    userOperation: OneOf<
        | (entryPointVersion extends "0.6"
              ? PartialBy<
                    UserOperation<"0.6">,
                    | "callGasLimit"
                    | "preVerificationGas"
                    | "verificationGasLimit"
                >
              : never)
        | (entryPointVersion extends "0.7"
              ? PartialBy<
                    UserOperation<"0.7">,
                    | "callGasLimit"
                    | "preVerificationGas"
                    | "verificationGasLimit"
                    | "paymasterVerificationGasLimit"
                    | "paymasterPostOpGasLimit"
                >
              : never)
    >
    entryPoint: {
        address: Address
        version: entryPointVersion
    }
    sponsorshipPolicyId?: string
    paymasterContext?: PaymasterContext | unknown
}

export type SponsorUserOperationReturnType<
    entryPointVersion extends EntryPointVersion = "0.7"
> = OneOf<
    | (entryPointVersion extends "0.6"
          ? {
                callGasLimit: bigint
                verificationGasLimit: bigint
                preVerificationGas: bigint
                paymasterAndData: Hex
            }
          : never)
    | (entryPointVersion extends "0.7"
          ? {
                callGasLimit: bigint
                verificationGasLimit: bigint
                preVerificationGas: bigint
                paymaster: Address
                paymasterVerificationGasLimit: bigint
                paymasterPostOpGasLimit: bigint
                paymasterData: Hex
            }
          : never)
>

export const sponsorUserOperation = async <
    entryPointVersion extends EntryPointVersion = EntryPointVersion
>(
    client: Client<
        Transport,
        Chain | undefined,
        Account | undefined,
        PimlicoRpcSchema<entryPointVersion>
    >,
    args: PimlicoSponsorUserOperationParameters<entryPointVersion>
): Promise<SponsorUserOperationReturnType<entryPointVersion>> => {
    const { sponsorshipPolicyId, paymasterContext, userOperation, entryPoint } =
        args

    const finalPaymasterContext =
        sponsorshipPolicyId !== undefined
            ? {
                  ...(paymasterContext ?? {}),
                  sponsorshipPolicyId
              }
            : paymasterContext

    const response = await client.request({
        method: "pm_sponsorUserOperation",
        params: finalPaymasterContext
            ? [
                  deepHexlify(userOperation),
                  entryPoint.address,
                  finalPaymasterContext
              ]
            : [deepHexlify(userOperation), entryPoint.address]
    })

    if (entryPoint.version === "0.6") {
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
        } as SponsorUserOperationReturnType<entryPointVersion>
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
    } as SponsorUserOperationReturnType<entryPointVersion>
}
