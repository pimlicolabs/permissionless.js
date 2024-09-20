// biome-ignore lint/style/useNodejsImportProtocol: we are not using node buffer here
import { Buffer } from "buffer"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import ReactDOM from "react-dom/client"
import { WagmiProvider } from "wagmi"

import App from "./App.tsx"
import { config } from "./wagmi.ts"

import "./index.css"
import { PaymasterServiceProvider } from "./usePaymasterService"

globalThis.Buffer = Buffer

const queryClient = new QueryClient()

const root = document.getElementById("root")

if (!root) throw new Error("No root element found")

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {/* Call it generic 5792 provider */}
                <PaymasterServiceProvider url="https://api.pimlico.io/v2/11155111/rpc?apikey=pim_b7CKRNXUWBDexiiVvAsrDT">
                    <App />
                </PaymasterServiceProvider>
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>
)
