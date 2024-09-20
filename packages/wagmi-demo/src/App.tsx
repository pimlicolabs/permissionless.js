import { useCallback } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { usePaymasterService } from "./usePaymasterService"
import { useSendTransaction } from "./useSendTransaction"
import { useWaitForTransactionReceipt } from "./useWaitForTransactionReceipt"

function App() {
    const account = useAccount()
    const { connectors, connect, status, error } = useConnect()
    const { disconnect } = useDisconnect()

    const {
        sendTransaction,
        data: transactionHash,
        isPending
    } = useSendTransaction({
        capabilities: {
            paymasterService: {
                url: "https://paymaster.example.com"
            }
        }
    })

    const { data: receipt, isPending: isReceiptPending } =
        useWaitForTransactionReceipt({
            id: transactionHash
        })

    console.log({
        transactionHash,
        isPending,
        receipt,
        isReceiptPending
    })

    const sendTransactionCallback = useCallback(async () => {
        console.log("Sending transaction...")
        sendTransaction({
            to: "0x433704c40F80cBff02e86FD36Bc8baC5e31eB0c1",
            data: "0x68656c6c6f"
        })
    }, [sendTransaction])

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
                    <button type="button" onClick={() => disconnect()}>
                        Disconnect
                    </button>
                )}
            </div>

            {account.status === "connected" && (
                <div style={{ marginTop: 60 }}>
                    <h2>Send test transaction</h2>

                    {isPending && <div>Sending transaction...</div>}

                    {transactionHash && (
                        <div>Awaiting confirmation: {transactionHash}</div>
                    )}

                    <button onClick={sendTransactionCallback} type="button">
                        Send Transaction
                    </button>
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
        </>
    )
}

export default App
