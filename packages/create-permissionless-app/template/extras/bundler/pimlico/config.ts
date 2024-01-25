import { createPimlicoBundlerClient } from "permissionless/clients/pimlico"
import { http } from "viem"
import { goerli } from "viem/chains"

export const bundlerClient = createPimlicoBundlerClient({
    chain: goerli,
    transport: http("https://api.pimlico.io/v1/CHAIN/rpc?apikey=API_KEY")
})
