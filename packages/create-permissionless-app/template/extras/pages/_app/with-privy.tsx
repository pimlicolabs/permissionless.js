import "@/styles/globals.css"
import { WagmiProvider } from "@privy-io/wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { AppProps, AppType } from "next/app"

import { privyConfig, wagmiConfig } from "@/config"
import { PrivyProvider } from "@privy-io/react-auth"

const queryClient = new QueryClient()

const App: AppType = ({ Component, pageProps }: AppProps) => {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
            config={privyConfig}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={wagmiConfig}>
                    <Component {...pageProps} />
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    )
}

export default App
