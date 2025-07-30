import cors from "@fastify/cors"
import Fastify from "fastify"
import { defineInstance } from "prool"
import { http, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
    deployErc20Token,
    erc20Address,
    sudoMintTokens
} from "./helpers/erc20-utils.js"
import { getChain } from "./helpers/utils.js"
import { createRpcHandler } from "./relay.js"
import { deployPaymasters } from "./singletonPaymasters.js"

export const paymaster = defineInstance(
    ({
        anvilRpc,
        altoRpc,
        port: _port,
        host: _host = "localhost"
    }: { anvilRpc: string; port: number; altoRpc: string; host?: string }) => {
        const app = Fastify({})

        return {
            _internal: {},
            host: _host,
            port: _port,
            name: "mock-paymaster",
            start: async ({ port = _port }) => {
                const paymasterSigner = createWalletClient({
                    chain: await getChain(anvilRpc),
                    account: privateKeyToAccount(
                        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                    ),
                    transport: http(anvilRpc)
                })

                await deployPaymasters({
                    anvilRpc,
                    paymasterSigner: paymasterSigner.account.address
                })
                await deployErc20Token(anvilRpc)

                app.register(cors, {
                    origin: "*",
                    methods: ["POST", "GET", "OPTIONS"]
                })

                const rpcHandler = createRpcHandler({
                    altoRpc,
                    anvilRpc,
                    paymasterSigner
                })
                app.post("/", {}, rpcHandler)

                app.get("/ping", async (_request, reply) => {
                    return reply.code(200).send({ message: "pong" })
                })

                await app.listen({ host: _host, port })
            },
            stop: async () => {
                app.close()
            }
        }
    }
)

export { erc20Address, sudoMintTokens }
