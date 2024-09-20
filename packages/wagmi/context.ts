import { createContext, createElement } from "react"
import type { WalletCapabilities, WalletSendCallsParameters } from "viem"

export const Erc5792HelperContext = createContext<{
    capabilities: WalletSendCallsParameters<WalletCapabilities>[number]["capabilities"]
}>({
    capabilities: {}
})

export type Erc5792HelperProviderProps = {
    capabilities: WalletSendCallsParameters<WalletCapabilities>[number]["capabilities"]
}

export const Erc5792HelperProvider = (
    parameters: React.PropsWithChildren<Erc5792HelperProviderProps>
) => {
    const { capabilities, children } = parameters

    const props = { value: { capabilities } }

    return createElement(Erc5792HelperContext.Provider, props, children)
}
