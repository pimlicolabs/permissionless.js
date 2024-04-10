import "@/styles/globals.css"
import type { AppProps } from "next/app"
import React from "react"

import { WagmiProvider } from "wagmi"

import { wagmiConfig } from "../config"

export default function App({ Component, pageProps }: AppProps) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <Component {...pageProps} />
        </WagmiProvider>
    )
}
