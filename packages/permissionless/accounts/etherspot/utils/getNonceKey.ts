import { type Address, concatHex, pad, toHex } from "viem"
import { VALIDATOR_MODE, VALIDATOR_TYPE } from "../constants.js"

export const getNonceKeyWithEncoding = (
    validatorAddress: Address,
    nonceKey = 0n
) => {
    const validatorMode = VALIDATOR_MODE.DEFAULT
    const validatorType = VALIDATOR_TYPE.ROOT
    const encoding = pad(
        concatHex([
            validatorAddress, // 20 bytes
            validatorMode, // 1 byte
            validatorType, // 1 byte
            toHex(nonceKey, { size: 2 }) // 2 byte
        ]),
        { size: 24 }
    ) // 24 bytes
    const encodedNonceKey = BigInt(encoding)
    return encodedNonceKey
}
