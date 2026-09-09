import type { SmartAccount } from "viem/erc4337"
import { getAccountNonce } from "../actions/public/getAccountNonce.js"

export function withNonceKey<account extends SmartAccount.SmartAccount>(
    account: account,
    {
        nonceKey = 0n,
        encodeKey = (key) => key
    }: {
        nonceKey?: bigint | undefined
        encodeKey?: ((key: bigint) => bigint) | undefined
    }
): account {
    return Object.assign(account, {
        getNonce: async (options?: SmartAccount.getNonce.Options) =>
            getAccountNonce(account.client, {
                address: account.address,
                entryPointAddress: account.entryPoint.address,
                key: encodeKey(options?.key ?? nonceKey)
            })
    })
}
