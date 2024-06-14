import type { Address } from "viem"
import { encodeFunctionData } from "viem"

/**
 * Wrapped this function to minimize the call to check if account is deployed
 */
export const getFactoryData = async ({
    bytes,
    index,
    secp256k1VerificationFacetAddress
}: {
    bytes: `0x${string}`
    index: bigint
    secp256k1VerificationFacetAddress: Address
}) => {
    return encodeFunctionData({
        abi: [
            {
                inputs: [
                    {
                        internalType: "address",
                        name: "_verificationFacet",
                        type: "address"
                    },
                    {
                        internalType: "bytes",
                        name: "_owner",
                        type: "bytes"
                    },
                    {
                        internalType: "uint256",
                        name: "_salt",
                        type: "uint256"
                    }
                ],
                name: "createAccount",
                outputs: [
                    {
                        internalType: "contract Barz",
                        name: "barz",
                        type: "address"
                    }
                ],
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        functionName: "createAccount",
        args: [secp256k1VerificationFacetAddress, bytes, index]
    })
}
