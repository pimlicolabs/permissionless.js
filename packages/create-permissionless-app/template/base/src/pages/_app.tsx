import "@/styles/globals.css"
import type { AppProps } from "next/app"
import React from "react"

import { WagmiConfig } from "wagmi"

import { wagmiConfig } from "../config"

export default function App({ Component, pageProps }: AppProps) {
    return (
        <WagmiConfig config={wagmiConfig}>
            <Component {...pageProps} />
        </WagmiConfig>
    )
}
