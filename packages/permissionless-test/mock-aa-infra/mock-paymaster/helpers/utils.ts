import { http, createWalletClient } from "viem"
import { mnemonicToAccount } from "viem/accounts"
import { foundry } from "viem/chains"

export const getAnvilWalletClient = (anvilRpc: string) => {
    const account = mnemonicToAccount(
        "test test test test test test test test test test test junk",
        {
            /* avoid nonce error with index 0 when deploying ep contracts. */
            addressIndex: 1
        }
    )

    const walletClient = createWalletClient({
        account,
        chain: foundry,
        transport: http(anvilRpc)
    })

    return walletClient
}
