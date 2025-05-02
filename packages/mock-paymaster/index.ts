import cors from "@fastify/cors"
import Fastify from "fastify"
import { defineInstance } from "prool"
import { http, createPublicClient } from "viem"
import { createBundlerClient } from "viem/account-abstraction"
import { foundry } from "viem/chains"
import { deployErc20Token } from "./helpers/erc20-utils.js"
import { getAnvilWalletClient } from "./helpers/utils.js"
import { createRpcHandler } from "./relay.js"
import {
    deployPaymasters,
    SingletonPaymasterV06,
    SingletonPaymasterV07,
    SingletonPaymasterV08
} from "./singletonPaymasters.js"

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
                const walletClient = getAnvilWalletClient({
                    anvilRpc,
                    addressIndex: 1
                })
                const publicClient = createPublicClient({
                    transport: http(anvilRpc),
                    chain: foundry
                })
                const bundler = createBundlerClient({
                    chain: foundry,
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
