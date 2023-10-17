import type { Address, PublicClient } from "viem"

export type GetAccountNonceParams = { sender: Address; entryPoint: Address; key?: bigint }

/**
 * Returns the nonce of the account with the entry point.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/public-actions/getAccountNonce
 *
 * @param publicClient {@link PublicClient} that you created using viem's createPublicClient.
 * @param args {@link GetAccountNonceParams} address, entryPoint & key
 * @returns bigint nonce
 *
 * @example
 * import { createPublicClient } from "viem"
 * import { getAccountNonce } from "permissionless/actions"
 *
 * const publicClient = createPublicClient({
 *      chain: goerli,
 *      transport: http("https://goerli.infura.io/v3/your-infura-key")
 * })
 *
 * const nonce = await getAccountNonce(publicClient, {
 *      address,
 *      entryPoint,
 *      key
 * })
 *
 * // Return 0n
 */
export const getAccountNonce = async (
    publicClient: PublicClient,
    { sender, entryPoint, key = BigInt(0) }: GetAccountNonceParams
): Promise<bigint> => {
    return await publicClient.readContract({
        address: entryPoint,
        abi: [
            {
                inputs: [
                    {
                        name: "sender",
                        type: "address"
                    },
                    {
                        name: "key",
                        type: "uint192"
                    }
                ],
                name: "getNonce",
                outputs: [
                    {
                        name: "nonce",
                        type: "uint256"
                    }
                ],
                stateMutability: "view",
                type: "function"
            }
        ],
        functionName: "getNonce",
        args: [sender, key]
    })
}
