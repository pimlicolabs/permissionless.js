import { createPimlicoBundlerClient } from "permissionless/clients/pimlico"
import { http } from "viem"
import { sepolia } from "viem/chains"

export const pimlicoBundlerConfig = createPimlicoBundlerClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_PIMLICO_BUNDLER_RPC_HOST)
})
