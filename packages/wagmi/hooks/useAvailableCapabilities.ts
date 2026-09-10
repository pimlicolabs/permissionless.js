"use client"

import { useContext, useMemo } from "react"
import type { Capabilities, WalletSendCallsParameters } from "viem"
import { useCapabilities, useConnection } from "wagmi"
import { PermissionlessContext } from "../context.js"

export const useAvailableCapabilities = () => {
    const { capabilities: capabilitiesConfigured } = useContext(
        PermissionlessContext
    )

    const account = useConnection()

    const { data: availableCapabilities } = useCapabilities({
        account: account.address
    })

    const memoisedCapabilities = useMemo(() => {
        if (!availableCapabilities || !account.chainId) return undefined
        const capabilitiesForChain = availableCapabilities[account.chainId]
        if (capabilitiesForChain === undefined) return undefined
        if (capabilitiesConfigured === undefined) return undefined

        let capabilities: WalletSendCallsParameters<Capabilities>[number]["capabilities"] =
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
