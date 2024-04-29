import { type Address, concatHex, maxUint16, pad, toHex } from "viem"
import { VALIDATOR_MODE, VALIDATOR_TYPE } from "../constants"
import type { KernelVersion } from "../signerToEcdsaKernelSmartAccount"

export const getNonceKeyWithEncoding = (
    accountVerion: KernelVersion,
    validatorAddress: Address,
    nonceKey = 0n
) => {
    if (accountVerion === "0.2.2") {
        return nonceKey
    }

    if (nonceKey > maxUint16)
        throw new Error(
            `nonce key must be equal or less than 2 bytes(maxUint16) for Kernel version ${accountVerion}`
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
    const encodedNonceKey = BigInt(encoding)
    return encodedNonceKey
}
