import { createContext, useMemo } from "react"
import { useAccount } from "wagmi"
import { useCapabilities } from "wagmi/experimental"

export const usePaymasterService = (url: string) => {
    const account = useAccount()

    const { data: availableCapabilities } = useCapabilities({
        account: account.address
    })

    const capabilities = useMemo(() => {
        if (!availableCapabilities || !account.chainId) return {}
        const capabilitiesForChain = availableCapabilities[account.chainId]
        if (capabilitiesForChain.paymasterService?.supported) {
            return {
                paymasterService: {
                    url
                }
            }
        }
        return {}
    }, [availableCapabilities, account.chainId, url])

    return { capabilities }
}

const PaymasterServiceContext = createContext<{
    url: string | null
}>({
    url: null
})

export const PaymasterServiceProvider = ({
    url,
    children
}: { url: string; children: React.ReactNode }) => {
    return (
        <PaymasterServiceContext.Provider value={{ url }}>
            {children}
        </PaymasterServiceContext.Provider>
    )
}
