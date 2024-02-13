import { createPimlicoPaymasterClient } from "permissionless/clients/pimlico"
import { http } from "viem"

export const pimlicoPaymasterConfig = createPimlicoPaymasterClient({
    transport: http(process.env.NEXT_PUBLIC_PIMLICO_PAYMASTER_RPC_HOST)
})
