import { type Address, concatHex, maxUint16, pad, toHex } from "viem"
import { VALIDATOR_MODE, VALIDATOR_TYPE } from "../constants.js"
import type { KernelVersion } from "../toKernelSmartAccount.js"
import { isKernelV2 } from "./isKernelV2.js"

export const getNonceKeyWithEncoding = (
    kernelVersion: KernelVersion<"0.6" | "0.7">,
    validatorAddress: Address,
    nonceKey = 0n
) => {
    if (isKernelV2(kernelVersion)) {
        return nonceKey
    }

    if (nonceKey > maxUint16)
        throw new Error(
            `nonce key must be equal or less than 2 bytes(maxUint16) for Kernel version ${kernelVersion}`
        )

    const validatorMode = VALIDATOR_MODE.DEFAULT
    const validatorType = VALIDATOR_TYPE.ROOT
    const encoding = pad(
        concatHex([
            validatorMode, // 1 byte
            validatorType, // 1 byte
            validatorAddress, // 20 bytes
            toHex(nonceKey, { size: 2 }) // 2 byte
        ]),
        { size: 24 }
    ) // 24 bytes

    return BigInt(encoding)
}
