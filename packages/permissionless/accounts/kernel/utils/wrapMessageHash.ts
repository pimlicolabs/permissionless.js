import { AbiParameters, type Address, Hash, Hex, TypedData } from "viem/utils"
import { isKernelV2, type Version } from "../version.js"

export type WrapMessageHashParameters = {
    hash: Hex.Hex
    address: Address.Address
    version: Version
    chainId: number
}

export const wrapMessageHash = ({
    hash,
    address,
    version,
    chainId
}: WrapMessageHashParameters) => {
    const domain = TypedData.domainSeparator({
        name: "Kernel",
        version,
        chainId,
        verifyingContract: address
    })
    const message = isKernelV2(version)
        ? hash
        : Hash.keccak256(
              AbiParameters.encode(
                  [{ type: "bytes32" }, { type: "bytes32" }],
                  [Hash.keccak256(Hex.fromString("Kernel(bytes32 hash)")), hash]
              )
          )
    return Hash.keccak256(Hex.concat("0x1901", domain, message))
}
