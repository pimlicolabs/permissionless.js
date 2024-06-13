import cors from "@fastify/cors"
import Fastify from "fastify"
import { defineInstance } from "prool"
import { http } from "viem"
import { foundry } from "viem/chains"
import {
    ENTRYPOINT_ADDRESS_V06,
    ENTRYPOINT_ADDRESS_V07
} from "../../../permissionless"
import { createPimlicoBundlerClient } from "../../../permissionless/clients/pimlico"
import { getAnvilWalletClient } from "./helpers/utils"
import {
    setupVerifyingPaymasterV06,
    setupVerifyingPaymasterV07
} from "./helpers/verifyingPaymasters"
import { createRpcHandler } from "./relay"

export const paymaster = defineInstance(
    ({
        anvilRpc,
        port: _port,
        altoRpc
    }: { anvilRpc: string; port: number; altoRpc: string }) => {
        const app = Fastify({})

        return {
            _internal: {},
            host: "localhost",
            port: _port,
            name: "mock-paymaster",
            start: async ({ port = _port }) => {
                const walletClient = getAnvilWalletClient(anvilRpc)
                const verifyingPaymasterV07 = await setupVerifyingPaymasterV07(
                    walletClient,
                    anvilRpc
                )
                const verifyingPaymasterV06 = await setupVerifyingPaymasterV06(
                    walletClient,
                    anvilRpc
                )

                const altoBundlerV07 = createPimlicoBundlerClient({
                    chain: foundry,
                    transport: http(altoRpc),
                    entryPoint: ENTRYPOINT_ADDRESS_V07
                })

                const altoBundlerV06 = createPimlicoBundlerClient({
                    chain: foundry,
                    transport: http(altoRpc),
                    entryPoint: ENTRYPOINT_ADDRESS_V06
                })

                app.register(cors, {
                    origin: "*",
                    methods: ["POST", "GET", "OPTIONS"]
                })

                const rpcHandler = createRpcHandler(
                    altoBundlerV07,
                    altoBundlerV06,
                    verifyingPaymasterV07,
                    verifyingPaymasterV06,
                    walletClient
                )
                app.post("/", {}, rpcHandler)

                app.get("/ping", async (_request, reply) => {
                    return reply.code(200).send({ message: "pong" })
                })

                await app.listen({ host: "localhost", port })
            },
            stop: async () => {
                app.close()
            }
        }
    }
)
