import { createContext, createElement } from "react"
import type { Capabilities, WalletSendCallsParameters } from "viem"

export const PermissionlessContext = createContext<{
    capabilities: WalletSendCallsParameters<Capabilities>[number]["capabilities"]
}>({
    capabilities: {}
})

export type PermissionlessProviderProps = {
    capabilities: WalletSendCallsParameters<Capabilities>[number]["capabilities"]
}

export const PermissionlessProvider = (
    parameters: React.PropsWithChildren<PermissionlessProviderProps>
) => {
    const { capabilities, children } = parameters

    const props = { value: { capabilities } }

    return createElement(PermissionlessContext.Provider, props, children)
}
