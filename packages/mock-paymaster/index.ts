import cors from "@fastify/cors"
import Fastify from "fastify"
import { defineInstance } from "prool"
import { http, createPublicClient } from "viem"
import { createBundlerClient } from "viem/account-abstraction"
import { deployErc20Token } from "./helpers/erc20-utils.js"
import { getAnvilWalletClient, getChain } from "./helpers/utils.js"
import { createRpcHandler } from "./relay.js"
import { deployPaymasters } from "./singletonPaymasters.js"

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
                const chain = await getChain(anvilRpc)
                const walletClient = await getAnvilWalletClient({
                    anvilRpc,
                    addressIndex: 1
                })
                const publicClient = createPublicClient({
                    transport: http(anvilRpc),
                    chain
                })
                const bundler = createBundlerClient({
                    chain,
                    transport: http(altoRpc)
                })

                await deployPaymasters({ walletClient, publicClient })
                await deployErc20Token(walletClient, publicClient)

                app.register(cors, {
                    origin: "*",
                    methods: ["POST", "GET", "OPTIONS"]
                })

                const rpcHandler = createRpcHandler({
                    bundler,
                    publicClient,
                    paymasterSigner: walletClient
                })
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
