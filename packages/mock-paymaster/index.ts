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

                const singletonPaymasterV08 = new SingletonPaymasterV08(
                    walletClient,
                    anvilRpc
                )
                const singletonPaymasterV07 = new SingletonPaymasterV07(
                    walletClient,
                    anvilRpc
                )
                const singletonPaymasterV06 = new SingletonPaymasterV06(
                    walletClient,
                    anvilRpc
                )

                await singletonPaymasterV08.setup()
                await singletonPaymasterV07.setup()
                await singletonPaymasterV06.setup()

                await deployErc20Token(walletClient, publicClient)

                app.register(cors, {
                    origin: "*",
                    methods: ["POST", "GET", "OPTIONS"]
                })

                const rpcHandler = createRpcHandler({
                    bundler,
                    singletonPaymasterV08,
                    singletonPaymasterV07,
                    singletonPaymasterV06
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
