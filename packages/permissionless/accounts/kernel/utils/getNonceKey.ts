import { type Address, Hex, Solidity } from "viem/utils"
import { KernelNonceKeyTooLargeError } from "../../../errors/kernel.js"
import { VALIDATOR_MODE, VALIDATOR_TYPE } from "../constants.js"
import { isKernelV2, type Version } from "../version.js"

export const getNonceKeyWithEncoding = (
    version: Version,
    validatorAddress: Address.Address,
    nonceKey = 0n
) => {
    if (isKernelV2(version)) return nonceKey
    if (nonceKey > Solidity.maxUint16)
        throw new KernelNonceKeyTooLargeError({ nonceKey, version })
    return BigInt(
        Hex.padLeft(
            Hex.concat(
                VALIDATOR_MODE.DEFAULT,
                VALIDATOR_TYPE.ROOT,
                validatorAddress,
                Hex.fromNumber(nonceKey, { size: 2 })
            ),
            24
        )
    )
}
