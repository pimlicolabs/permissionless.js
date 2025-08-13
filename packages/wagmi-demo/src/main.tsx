import { Buffer } from "buffer"
import { PermissionlessProvider } from "@permissionless/wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React, { useEffect } from "react"
import ReactDOM from "react-dom/client"
import {
    WagmiProvider,
    useAccount,
    useConnect,
    useDisconnect,
    useWalletClient
} from "wagmi"

import App from "./App.tsx"
import { capabilities, config } from "./wagmi.ts"

import "./index.css"
import { http, type Transport, getClient } from "@wagmi/core"
import {
    type SafeSmartAccountImplementation,
    toSafeSmartAccount
} from "permissionless/accounts"
import {
    type SmartAccountClient,
    createSmartAccountClient
} from "permissionless/clients"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import { type Chain, zeroAddress } from "viem"
import {
    type SmartAccount,
    entryPoint07Address
} from "viem/account-abstraction"
import { PasskeyServerDemo } from "./PasskeyServerDemo"
import { PasskeysDemo } from "./PasskeysDemo"
import { pimlicoApiKey } from "./wagmi"

globalThis.Buffer = Buffer

const queryClient = new QueryClient()

const root = document.getElementById("root")

if (!root) throw new Error("No root element found")

function Temp() {
    const [smartAccountClient, setSmartAccountClient] =
        React.useState<SmartAccountClient<
            Transport,
            Chain,
            SmartAccount<SafeSmartAccountImplementation>
        > | null>(null)
    const account = useAccount()
    const { connectors, connect, status, error } = useConnect()
    const { disconnect } = useDisconnect()
    const { data: walletClient } = useWalletClient()
    const publicClient = getClient(config)

    useEffect(() => {
        if (account.status !== "connected") {
            return
        }
        if (!walletClient) {
            return
        }

        const createSafeAccount = async () => {
            const safeAccount = await toSafeSmartAccount({
                client: publicClient,
                entryPoint: {
                    address: entryPoint07Address,
                    version: "0.7"
                },
                owners: [walletClient],
                saltNonce: 0n, // optional
                version: "1.4.1"
            })

            const paymasterClient = createPimlicoClient({
                chain: publicClient.chain,
                transport: http(
                    `https://api.pimlico.io/v2/${publicClient.chain.id}/rpc?apikey=${pimlicoApiKey}`
                )
            })

            const smartAccountClient = createSmartAccountClient({
                account: safeAccount,
                chain: publicClient.chain,
                paymaster: paymasterClient,
                bundlerTransport: http(
                    `https://api.pimlico.io/v2/${publicClient.chain.id}/rpc?apikey=${pimlicoApiKey}`
                ),
                userOperation: {
                    estimateFeesPerGas: async () =>
                        (await paymasterClient.getUserOperationGasPrice()).fast
                }
            })

            setSmartAccountClient(smartAccountClient)
        }

        createSafeAccount()
    }, [account, publicClient, walletClient])

    const [sendTransactionStatus, setSendTransactionStatus] = React.useState<
        "idle" | "pending" | "success" | "error"
    >("idle")

    const sendTransaction = async () => {
        if (!smartAccountClient) {
            return
        }

        setSendTransactionStatus("pending")

        const tx = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n
        })

        console.log(tx)

        setSendTransactionStatus("success")
    }

    return (
        <div>
            {account.status === "connected" && (
                <div style={{ marginTop: 60 }}>
                    <h3>Account: {walletClient?.account.address}</h3>
                    <h3>
                        Smart Account: {smartAccountClient?.account.address}
                    </h3>
                    <h2>Send test transaction</h2>
                    {sendTransactionStatus === "pending" && (
                        <div>Sending...</div>
                    )}
                    {sendTransactionStatus === "success" && <div>Success</div>}
                    {sendTransactionStatus === "error" && <div>Error</div>}
                    <div>
                        <button type="button" onClick={sendTransaction}>
                            Send test transaction
                        </button>
                    </div>
                    <div>
                        <button type="button" onClick={() => disconnect()}>
                            Disconnect
                        </button>
                    </div>
                </div>
            )}

            {account.status === "disconnected" && (
                <div style={{ marginTop: 60 }}>
                    <h2>Connect</h2>
                    {connectors.map((connector) => (
                        <button
                            key={connector.uid}
                            onClick={() => connect({ connector })}
                            type="button"
                            style={{ marginRight: 10 }}
                        >
                            {connector.name}
                        </button>
                    ))}
                    <div>{status}</div>
                    <div>{error?.message}</div>
                </div>
            )}
        </div>
    )
}

function Main() {
    const [path, setPath] = React.useState(window.location.pathname)

    React.useEffect(() => {
        // Handle initial page load - push current state to history
        if (window.location.pathname !== "/") {
            window.history.replaceState(
                { path: window.location.pathname },
                "",
                window.location.pathname
            )
        }
    }, [])

    const handleSelection = (
        component:
            | "app"
            | "passkey"
            | "passkeyServer"
            | "temp"
            | "passkey/kernel"
            | "passkey/safe"
    ) => {
        const newPath = `/${component}`
        window.history.pushState({ path: newPath }, "", newPath)
        setPath(newPath)
    }

    const handleBack = () => {
        window.history.back()
    }
    console.log({ path })

    React.useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            console.log("popstate event fired", window.location.pathname)
            setPath(window.location.pathname)
        }
        window.addEventListener("popstate", handlePopState)
        return () => {
            window.removeEventListener("popstate", handlePopState)
        }
    }, [])

    return (
        <React.StrictMode>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    <PermissionlessProvider capabilities={capabilities}>
                        {path === "/" ? (
                            <div>
                                <button
                                    type="button"
                                    style={{ marginRight: "10px" }}
                                    onClick={() => handleSelection("app")}
                                >
                                    App
                                </button>
                                <button
                                    type="button"
                                    style={{ marginRight: "10px" }}
                                    onClick={() => handleSelection("passkey")}
                                >
                                    Passkey
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleSelection("passkeyServer")
                                    }
                                >
                                    Passkey Server
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div>
                                    <button type="button" onClick={handleBack}>
                                        Back
                                    </button>
                                </div>
                                {path === "/app" && <App />}
                                {(path === "/passkey" ||
                                    path.startsWith("/passkey/")) && (
                                    <PasskeysDemo
                                        path={path}
                                        handleSelection={handleSelection}
                                    />
                                )}
                                {path === "/passkeyServer" && (
                                    <PasskeyServerDemo />
                                )}
                                {path === "/temp" && <Temp />}
                            </div>
                        )}
                    </PermissionlessProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </React.StrictMode>
    )
}

ReactDOM.createRoot(root).render(<Main />)
