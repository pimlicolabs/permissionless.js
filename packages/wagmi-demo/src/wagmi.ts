import { baseSepolia } from "viem/chains"
import { http, createConfig } from "wagmi"
import { coinbaseWallet } from "wagmi/connectors"

export const config = createConfig({
    chains: [baseSepolia],
    connectors: [
        coinbaseWallet({ appName: "Pimlico", preference: "smartWalletOnly" })
    ],
    transports: {
        [baseSepolia.id]: http("https://sepolia.base.org")
    }
})

declare module "wagmi" {
    interface Register {
        config: typeof config
    }
}
