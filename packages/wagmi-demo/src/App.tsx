import React from "react"
import {
    createSmartAccountClient,
    walletClientToCustomSigner
} from "permissionless"
import { signerToSafeSmartAccount } from "permissionless/accounts"
import {
    useAccount,
    useConfig,
    useConnect,
    useDisconnect,
    useSendTransaction
} from "wagmi"
import { http, zeroAddress } from "viem"
import { getPublicClient, getWalletClient } from "wagmi/actions"
import { createPimlicoPaymasterClient } from "permissionless/clients/pimlico"
import { smartAccount } from "@permissionless/wagmi"

function App() {
    const account = useAccount()
    const { connectors, connect, status, error } = useConnect()
    const { disconnect } = useDisconnect()
    const config = useConfig()

    const connectSmartAccount = async () => {
        const client = getPublicClient(config)
        const walletClient = await getWalletClient(config)

        const pimlicoClient = createPimlicoPaymasterClient({
            transport: http(import.meta.env.PAYMASTER_URL)
        })

        if (!walletClient) return

        const smartAccountClient = createSmartAccountClient({
            account: await signerToSafeSmartAccount(client, {
                safeVersion: "1.4.1",
                entryPoint: import.meta.env.ENTRY_POINT,
                signer: walletClientToCustomSigner(walletClient)
            }),
            transport: http(import.meta.env.BUNDLER_URL),
            sponsorUserOperation: pimlicoClient.sponsorUserOperation
        })

        const connector = smartAccount({
            smartAccountClient: smartAccountClient
        })

        connect({ connector })
    }

    const {
        data: hash,
        sendTransaction,
        error: sendTransactionError,
        isPending
    } = useSendTransaction()

    const sendTransactionOnButtonPress = () => {
        sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })
    }

    console.log("error: ", sendTransactionError)

    return (
        <>
            <div>
                <h2>Account</h2>

                <div>
                    status: {account.status}
                    <br />
                    addresses: {JSON.stringify(account.addresses)}
                    <br />
                    chainId: {account.chainId}
                </div>

                {account.status === "connected" && (
                    <>
                        <button type="button" onClick={() => disconnect()}>
                            Disconnect
                        </button>

                        <button
                            style={{ marginLeft: 12 }}
                            type="button"
                            onClick={() => sendTransactionOnButtonPress()}
                        >
                            Send dummy transaction
                        </button>

                        {isPending && (
                            <div>
                                Executing transaction...
                                <div className="loader" />
                            </div>
                        )}
                        {hash && <div>hash: {hash}</div>}
                    </>
                )}
            </div>

            <div>
                <h2>Connect</h2>
                <button
                    key={"smartAccount"}
                    onClick={() => connectSmartAccount()}
                    type="button"
                >
                    Custom safe smart account
                </button>
                {connectors.map((connector) => (
                    <button
                        style={{ marginLeft: 12 }}
                        key={connector.uid}
                        onClick={() => connect({ connector })}
                        type="button"
                    >
                        {connector.name}
                    </button>
                ))}
                <div>{status}</div>
                <div>{error?.message}</div>
            </div>
        </>
    )
}

export default App
