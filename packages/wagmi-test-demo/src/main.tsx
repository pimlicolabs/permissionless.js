import { Buffer } from "buffer"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import ReactDOM from "react-dom/client"
import { http, WagmiProvider, createConfig } from "wagmi"
import App from "./App.tsx"

import { sepolia } from "viem/chains"
import "./index.css"

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
