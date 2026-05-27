import {
    type Address,
    type Hex,
    type Prettify,
    concatHex,
    domainSeparator,
    encodeAbiParameters,
    keccak256,
    stringToHex
} from "viem"
import type { KernelVersion } from "../toKernelSmartAccount.js"
import { isKernelV2 } from "./isKernelV2.js"

export type WrapMessageHashParams = {
    version: KernelVersion<"0.6" | "0.7">
    address: Address
    chainId: number
}

export const wrapMessageHash = ({
    hash,
    address: accountAddress,
    version: kernelVersion,
    chainId
}: Prettify<{ hash: Hex } & WrapMessageHashParams>) => {
    const _domainSeparator = domainSeparator({
        domain: {
            name: "Kernel",
            version: kernelVersion,
            chainId,
            verifyingContract: accountAddress
        }
    })
    const wrappedMessageHash = isKernelV2(kernelVersion)
        ? hash
        : keccak256(
              encodeAbiParameters(
                  [{ type: "bytes32" }, { type: "bytes32" }],
                  [keccak256(stringToHex("Kernel(bytes32 hash)")), hash]
              )
          )

    const digest = keccak256(
        concatHex(["0x1901", _domainSeparator, wrappedMessageHash])
    )
    return digest
}
