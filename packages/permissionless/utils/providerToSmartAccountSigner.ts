import {
    type EIP1193Provider,
    type Hex,
    createWalletClient,
    custom
} from "viem"
import { walletClientToSmartAccountSigner } from "./walletClientToSmartAccountSigner"

export const providerToSmartAccountSigner = async (
    provider: EIP1193Provider,
    params?: {
        signerAddress: Hex
    }
) => {
    let account: Hex
    if (!params) {
        try {
            ;[account] = await provider.request({
                method: "eth_requestAccounts"
            })
        } catch {
            ;[account] = await provider.request({
                method: "eth_accounts"
            })
        }
    } else {
        account = params.signerAddress
    }
    const walletClient = createWalletClient({
        account: account as Hex,
        transport: custom(provider)
    })
    return walletClientToSmartAccountSigner(walletClient)
}
