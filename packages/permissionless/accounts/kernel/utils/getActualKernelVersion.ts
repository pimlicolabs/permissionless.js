import { type Address, type Client, getContract } from "viem"
import type { KernelVersion } from "../toEcdsaKernelSmartAccount"

// If the kernel contract is already deployed, we can get the actual version from the contract
export async function getActualKernelVersion(
    client: Client,
    address: Address,
    version: KernelVersion<"0.6" | "0.7">
): Promise<KernelVersion<"0.6" | "0.7">> {
    try {
        const contract = getContract({
            address,
            abi: [
                {
                    type: "function",
                    name: "eip712Domain",
                    inputs: [],
                    outputs: [
                        {
                            name: "fields",
                            type: "bytes1",
                            internalType: "bytes1"
                        },
                        {
                            name: "name",
                            type: "string",
                            internalType: "string"
                        },
                        {
                            name: "version",
                            type: "string",
                            internalType: "string"
                        },
                        {
                            name: "chainId",
                            type: "uint256",
                            internalType: "uint256"
                        },
                        {
                            name: "verifyingContract",
                            type: "address",
                            internalType: "address"
                        },
                        {
                            name: "salt",
                            type: "bytes32",
                            internalType: "bytes32"
                        },
                        {
                            name: "extensions",
                            type: "uint256[]",
                            internalType: "uint256[]"
                        }
                    ],
                    stateMutability: "view"
                }
            ],
            client
        })

        const [, , version] = await contract.read.eip712Domain()

        return version as KernelVersion<"0.6" | "0.7">
    } catch {
        return version
    }
}
