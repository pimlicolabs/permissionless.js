import {
    type EIP1193Provider,
    type Hex,
    createWalletClient,
    custom
} from "viem"
import { walletClientToSmartAccountSigner } from "./walletClientToSmartAccountSigner.js"

export const providerToSmartAccountSigner = async (
    provider: EIP1193Provider,
    signerAddress?: Hex
) => {
    let account: Hex
    if (!signerAddress) {
        ;[account] = await provider.request({ method: "eth_requestAccounts" })
    } else {
        account = signerAddress
    }
    const walletClient = createWalletClient({
        account: account as Hex,
        transport: custom(provider)
    })
    return walletClientToSmartAccountSigner(walletClient)
}
