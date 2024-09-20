import { sepolia } from "viem/chains"
import { http, createConfig } from "wagmi"
import { coinbaseWallet } from "wagmi/connectors"

export const config = createConfig({
    chains: [sepolia],
    connectors: [
        coinbaseWallet({ appName: "Pimlico", preference: "smartWalletOnly" })
    ],
    transports: {
        [sepolia.id]: http("https://rpc.ankr.com/eth_sepolia")
    }
})

declare module "wagmi" {
    interface Register {
        config: typeof config
    }
}
