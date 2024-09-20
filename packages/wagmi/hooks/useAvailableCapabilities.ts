"use client"

import { useContext, useMemo } from "react"
import type { WalletCapabilities, WalletSendCallsParameters } from "viem"
import { useAccount } from "wagmi"
import { useCapabilities } from "wagmi/experimental"
import { Erc5792HelperContext } from "../context"

export const useAvailableCapabilities = () => {
    const { capabilities: capabilitiesConfigured } =
        useContext(Erc5792HelperContext)

    const account = useAccount()

    const { data: availableCapabilities } = useCapabilities({
        account: account.address
    })

    const memoisedCapabilities = useMemo(() => {
        if (!availableCapabilities || !account.chainId) return undefined
        const capabilitiesForChain = availableCapabilities[account.chainId]
        if (capabilitiesConfigured === undefined) return undefined

        let capabilities: WalletSendCallsParameters<WalletCapabilities>[number]["capabilities"] =
            undefined

        for (const capabilityConfigured in capabilitiesConfigured) {
            if (capabilitiesForChain[capabilityConfigured]?.supported) {
                if (!capabilities) {
                    capabilities = {}
                }
                capabilities[capabilityConfigured] = {
                    ...capabilitiesConfigured[capabilityConfigured]
                }
            }
        }

        return capabilities
    }, [availableCapabilities, account.chainId, capabilitiesConfigured])

    return { capabilities: memoisedCapabilities }
}
