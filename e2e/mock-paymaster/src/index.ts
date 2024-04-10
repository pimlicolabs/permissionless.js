import cors from "@fastify/cors"
import Fastify from "fastify"
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless"
import { createPimlicoBundlerClient } from "permissionless/clients/pimlico"
import { http } from "viem"
import { foundry } from "viem/chains"
import { getAnvilWalletClient } from "./helpers/utils"
import { setupVerifyingPaymasterV07 } from "./helpers/verifyingPaymasters"
import { createRpcHandler } from "./relay"

const main = async () => {
    const walletClient = getAnvilWalletClient()
    const verifyingPaymasterV07 = await setupVerifyingPaymasterV07(walletClient)

    const altoBundler = createPimlicoBundlerClient({
        chain: foundry,
        transport: http(process.env.ALTO_RPC),
        entryPoint: ENTRYPOINT_ADDRESS_V07
    })

    const app = Fastify({})

    app.register(cors, {
        origin: "*",
        methods: ["POST", "GET", "OPTIONS"]
    })

    const rpcHandler = createRpcHandler(
        altoBundler,
        verifyingPaymasterV07,
        walletClient
    )
    app.post("/", {}, rpcHandler)

    await app.listen({ host: "0.0.0.0", port: 3000 })
}

main()
