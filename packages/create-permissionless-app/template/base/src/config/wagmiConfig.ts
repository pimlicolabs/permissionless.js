import { WagmiConfig, configureChains, createConfig, sepolia } from "wagmi"
import { jsonRpcProvider } from "wagmi/providers/jsonRpc"

export const wagmiChainsConfig = configureChains(
    [sepolia],
    [
        jsonRpcProvider({
            rpc: () => ({
                http: process.env.NEXT_PUBLIC_RPC_URL
            })
        })
    ]
)

export const wagmiConfig = createConfig({
    autoConnect: true,
    publicClient: wagmiChainsConfig.publicClient
})
