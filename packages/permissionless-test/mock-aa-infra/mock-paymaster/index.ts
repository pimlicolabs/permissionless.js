import cors from "@fastify/cors"
import Fastify from "fastify"
import { defineInstance } from "prool"
import { http, createPublicClient } from "viem"
import { createBundlerClient } from "viem/account-abstraction"
import { foundry } from "viem/chains"
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

                const publicClient = createPublicClient({
                    transport: http(anvilRpc),
                    chain: foundry
                })

                const bundler = createBundlerClient({
                    chain: foundry,
                    transport: http(altoRpc)
                })

                app.register(cors, {
                    origin: "*",
                    methods: ["POST", "GET", "OPTIONS"]
                })

                const rpcHandler = createRpcHandler(
                    bundler,
                    verifyingPaymasterV07,
                    verifyingPaymasterV06,
                    publicClient,
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
