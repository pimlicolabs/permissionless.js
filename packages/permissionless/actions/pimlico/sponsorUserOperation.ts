import type { Client, Transport } from "viem"
import type { EntryPoint, UserOperation } from "viem/erc4337"
import type { Address, Hex } from "viem/utils"
import type { PimlicoRpcSchema } from "../../types/pimlico.js"
import type { OneOf, PartialBy } from "../../types/utils.js"
import { deepHexlify } from "../../utils/deepHexlify.js"

type PaymasterContext = {
    sponsorshipPolicyId?: string
    validForSeconds?: number
    meta?: Record<string, string>
    [key: string]: unknown
}

export type PimlicoSponsorUserOperationParameters<
    entryPointVersion extends EntryPoint.Version
> = {
    userOperation: OneOf<
        | (entryPointVersion extends "0.6"
              ? PartialBy<
                    UserOperation.UserOperation<"0.6">,
                    | "callGasLimit"
                    | "preVerificationGas"
                    | "verificationGasLimit"
                >
              : never)
        | (entryPointVersion extends "0.7"
              ? PartialBy<
                    UserOperation.UserOperation<"0.7">,
                    | "callGasLimit"
                    | "preVerificationGas"
                    | "verificationGasLimit"
                    | "paymasterVerificationGasLimit"
                    | "paymasterPostOpGasLimit"
                >
              : never)
    >
    entryPoint: {
        address: Address.Address
        version: entryPointVersion
    }
    sponsorshipPolicyId?: string
    paymasterContext?: PaymasterContext | unknown
}

export type SponsorUserOperationReturnType<
    entryPointVersion extends EntryPoint.Version = "0.7"
> = OneOf<
    | (entryPointVersion extends "0.6"
          ? {
                callGasLimit: bigint
                verificationGasLimit: bigint
                preVerificationGas: bigint
                paymasterAndData: Hex.Hex
            }
          : never)
    | (entryPointVersion extends "0.7"
          ? {
                callGasLimit: bigint
                verificationGasLimit: bigint
                preVerificationGas: bigint
                paymaster: Address.Address
                paymasterVerificationGasLimit: bigint
                paymasterPostOpGasLimit: bigint
                paymasterData: Hex.Hex
            }
          : never)
>

export const sponsorUserOperation = async <
    entryPointVersion extends EntryPoint.Version = EntryPoint.Version
>(
    client: Pick<Client.Client, "request">,
    args: PimlicoSponsorUserOperationParameters<entryPointVersion>
): Promise<SponsorUserOperationReturnType<entryPointVersion>> => {
    const { sponsorshipPolicyId, paymasterContext, userOperation, entryPoint } =
        args

    const finalPaymasterContext =
        sponsorshipPolicyId === undefined
            ? paymasterContext
            : {
                  ...(paymasterContext ?? {}),
                  sponsorshipPolicyId
              }

    const request = client.request as Transport.RequestFn<
        PimlicoRpcSchema<entryPointVersion>
    >
    const response = await request({
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
            paymasterAndData: Hex.Hex
            preVerificationGas: Hex.Hex
            verificationGasLimit: Hex.Hex
            callGasLimit: Hex.Hex
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
        preVerificationGas: Hex.Hex
        verificationGasLimit: Hex.Hex
        callGasLimit: Hex.Hex
        paymaster: Address.Address
        paymasterVerificationGasLimit: Hex.Hex
        paymasterPostOpGasLimit: Hex.Hex
        paymasterData: Hex.Hex
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
