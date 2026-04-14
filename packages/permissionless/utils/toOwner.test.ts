import { http, createWalletClient } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../permissionless-test/src/testWithRpc"
import { toOwner } from "./toOwner"

describe("toOwner", () => {
    testWithRpc(
        "returns LocalAccount unchanged when passed directly",
        async ({ rpc }) => {
            const privateKey = generatePrivateKey()
            const localAccount = privateKeyToAccount(privateKey)

            const result = await toOwner({
                owner: localAccount
            })

            expect(result.address).toBe(localAccount.address)
            expect(result.type).toBe("local")
        }
    )

    testWithRpc("converts WalletClient to LocalAccount", async ({ rpc }) => {
        const privateKey = generatePrivateKey()
        const account = privateKeyToAccount(privateKey)

        const walletClient = createWalletClient({
            account,
            chain: foundry,
            transport: http(rpc.anvilRpc)
        })

        // WalletClient has a `request` method, so toOwner treats it
        // as a provider. Provide the address explicitly.
        const result = await toOwner({
            owner: walletClient,
            address: account.address
        })

        expect(result.address).toBe(account.address)
    })

    testWithRpc(
        "converts EthereumProvider with explicit address",
        async ({ rpc }) => {
            const privateKey = generatePrivateKey()
            const account = privateKeyToAccount(privateKey)

            const walletClient = createWalletClient({
                account,
                chain: foundry,
                transport: http(rpc.anvilRpc)
            })

            // Create a mock provider that implements the request interface
            const provider = {
                request: walletClient.request
            }

            const result = await toOwner({
                owner: provider,
                address: account.address
            })

            expect(result.address).toBe(account.address)
        }
    )

    testWithRpc(
        "converts EthereumProvider without address using eth_accounts",
        async ({ rpc }) => {
            const privateKey = generatePrivateKey()
            const account = privateKeyToAccount(privateKey)

            // Create a mock provider that returns accounts
            const provider = {
                request: async ({ method }: { method: string }) => {
                    if (
                        method === "eth_requestAccounts" ||
                        method === "eth_accounts"
                    ) {
                        return [account.address]
                    }
                    // Forward other requests
                    const walletClient = createWalletClient({
                        account,
                        chain: foundry,
                        transport: http(rpc.anvilRpc)
                    })
                    return walletClient.request({
                        method,
                        params: []
                    } as any)
                }
            }

            const result = await toOwner({
                owner: provider
            })

            expect(result.address).toBe(account.address)
        }
    )

    testWithRpc(
        "falls back to eth_accounts when eth_requestAccounts fails",
        async ({ rpc }) => {
            const privateKey = generatePrivateKey()
            const account = privateKeyToAccount(privateKey)

            const provider = {
                request: async ({ method }: { method: string }) => {
                    if (method === "eth_requestAccounts") {
                        throw new Error("Not supported")
                    }
                    if (method === "eth_accounts") {
                        return [account.address]
                    }
                    const walletClient = createWalletClient({
                        account,
                        chain: foundry,
                        transport: http(rpc.anvilRpc)
                    })
                    return walletClient.request({
                        method,
                        params: []
                    } as any)
                }
            }

            const result = await toOwner({
                owner: provider
            })

            expect(result.address).toBe(account.address)
        }
    )

    testWithRpc("created account can sign messages", async ({ rpc }) => {
        const privateKey = generatePrivateKey()
        const account = privateKeyToAccount(privateKey)

        const walletClient = createWalletClient({
            account,
            chain: foundry,
            transport: http(rpc.anvilRpc)
        })

        const result = await toOwner({
            owner: walletClient
        })

        const signature = await result.signMessage({
            message: "hello"
        })
        expect(signature).toBeDefined()
        expect(signature.startsWith("0x")).toBe(true)
    })

    testWithRpc(
        "created account throws on signTransaction",
        async ({ rpc }) => {
            const privateKey = generatePrivateKey()
            const account = privateKeyToAccount(privateKey)

            const walletClient = createWalletClient({
                account,
                chain: foundry,
                transport: http(rpc.anvilRpc)
            })

            const result = await toOwner({
                owner: walletClient
            })

            await expect(result.signTransaction({} as any)).rejects.toThrow(
                "Smart account signer doesn't need to sign transactions"
            )
        }
    )
})
