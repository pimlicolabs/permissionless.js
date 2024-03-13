import "@/styles/globals.css"
import type { AppProps, AppType } from "next/app"
import { WagmiConfig } from "wagmi"

import { privyConfig, wagmiChainsConfig, wagmiConfig } from "@/config"
import { PrivyProvider } from "@privy-io/react-auth"
import { PrivyWagmiConnector } from "@privy-io/wagmi-connector"

const App: AppType = ({ Component, pageProps }: AppProps) => {
    return (
        <WagmiConfig config={wagmiConfig}>
            <PrivyProvider
                appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
                config={privyConfig}
            >
                <PrivyWagmiConnector wagmiChainsConfig={wagmiChainsConfig}>
                    <Component {...pageProps} />
                </PrivyWagmiConnector>
            </PrivyProvider>
        </WagmiConfig>
    )
}

export default App
