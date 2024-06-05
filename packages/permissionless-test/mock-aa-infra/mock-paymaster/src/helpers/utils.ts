import { http, createWalletClient } from "viem"
import { mnemonicToAccount } from "viem/accounts"
import { foundry } from "viem/chains"

export const getAnvilWalletClient = () => {
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
        transport: http(process.env.ANVIL_RPC)
    })

    return walletClient
}
