import {
    type Hex,
    concatHex,
    encodeAbiParameters,
    keccak256,
    stringToHex
} from "viem"
import { type Address, domainSeparator } from "viem"
import type { KernelVersion } from "../toKernelSmartAccount.js"
import { isKernelV2 } from "./isKernelV2.js"

export type WrapMessageHashParams = {
    kernelVersion: KernelVersion<"0.6" | "0.7">
    accountAddress: Address
    chainId: number
}

export const wrapMessageHash = (
    messageHash: Hex,
    { accountAddress, kernelVersion, chainId }: WrapMessageHashParams
) => {
    const _domainSeparator = domainSeparator({
        domain: {
            name: "Kernel",
            version: kernelVersion,
            chainId,
            verifyingContract: accountAddress
        }
    })
    const wrappedMessageHash = isKernelV2(kernelVersion)
        ? messageHash
        : keccak256(
              encodeAbiParameters(
                  [{ type: "bytes32" }, { type: "bytes32" }],
                  [keccak256(stringToHex("Kernel(bytes32 hash)")), messageHash]
              )
          )

    const digest = keccak256(
        concatHex(["0x1901", _domainSeparator, wrappedMessageHash])
    )
    return digest
}
