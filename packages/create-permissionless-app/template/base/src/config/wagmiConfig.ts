import { sepolia } from "viem/chains"
import { http, createConfig } from "wagmi"

export const wagmiConfig = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]: http()
    }
})
