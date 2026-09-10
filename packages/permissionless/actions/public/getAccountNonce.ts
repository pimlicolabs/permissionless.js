import { Actions, type Client } from "viem"
import type { Address } from "viem/utils"
import { getAction } from "../../utils/getAction.js"

export type GetAccountNonceParams = {
    address: Address.Address
    entryPointAddress: Address.Address
    key?: bigint
}

/**
 * Returns the nonce of the account with the entry point.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/public-actions/getAccountNonce
 *
 * @param client viem client.
 * @param args {@link GetAccountNonceParams} address, entryPoint & key
 * @returns bigint nonce
 *
 * @example
 * import { Client, http } from "viem"
 * import { sepolia } from "viem/chains"
 * import { EntryPoint } from "viem/erc4337"
 * import { getAccountNonce } from "permissionless"
 *
 * const client = Client.create({ chain: sepolia, transport: http() })
 *
 * const nonce = await getAccountNonce(client, {
 *     address,
 *     entryPointAddress: EntryPoint.addressV07,
 *     key
 * })
 * // 0n
 */
export const getAccountNonce = async (
    client: Client.Client,
    args: GetAccountNonceParams
): Promise<bigint> => {
    const { address, entryPointAddress, key = BigInt(0) } = args

    return await getAction(
        client,
        Actions.contract.read,
        "contract.read"
    )({
        address: entryPointAddress,
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
        args: [address, key]
    })
}
