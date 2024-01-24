import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Buffer } from "buffer"
import ReactDOM from "react-dom/client"
import { WagmiProvider, createConfig, http } from "wagmi"
import App from "./App.tsx"

import "./index.css"
import { sepolia } from "viem/chains"

globalThis.Buffer = Buffer

const queryClient = new QueryClient()

const root = document.getElementById("root")

if (!root) throw new Error("No root element found")

const config = createConfig({
    chains: [sepolia],
    connectors: [],
    transports: {
        [sepolia.id]: http(import.meta.env.RPC_URL)
    }
})

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>
)
