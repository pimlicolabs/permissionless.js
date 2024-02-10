import { createPimlicoBundlerClient } from "permissionless/clients/pimlico"
import { http } from "viem"
import { sepolia } from "viem/chains"

export const bundlerClient = createPimlicoBundlerClient({
    chain: sepolia,
    transport: http("https://api.pimlico.io/v1/sepolia/rpc?apikey=API_KEY")
})
