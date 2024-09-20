import {
    biconomySmartAccount,
    kernelSmartAccount,
    simpleSmartAccount
} from "@permissionless/wagmi"
import { safeSmartAccount } from "@permissionless/wagmi"
import { createPimlicoPaymasterClient } from "permissionless/clients/pimlico"
import { walletClientToSmartAccountSigner } from "permissionless/utils"
import React from "react"
import { http, type Address, zeroAddress } from "viem"
import {
    type CreateConnectorFn,
    useAccount,
    useConfig,
    useConnect,
    useDisconnect,
    useSendTransaction
} from "wagmi"
import { getPublicClient, getWalletClient } from "wagmi/actions"

function App() {
    const account = useAccount()
    const { connectors, connect, status, error } = useConnect()
    const { disconnect } = useDisconnect()
    const config = useConfig()

    const smartAccounts = ["Simple", "Safe", "Biconomy", "Kernel"]

    const connectSmartAccount = async (smartAccount: string) => {
        const publicClient = getPublicClient(config)
        const walletClient = await getWalletClient(config)

        if (!publicClient) {
            throw new Error("publicClient not found")
        }

        const pimlicoClient = createPimlicoPaymasterClient({
            transport: http(import.meta.env.VITE_PAYMASTER_URL as string)
        })

        let connector: CreateConnectorFn

        switch (smartAccount) {
            case "Simple":
                connector = await simpleSmartAccount({
                    publicClient,
                    bundlerTransport: http(
                        import.meta.env.VITE_BUNDLER_RPC_HOST
                    ),
                    signer: walletClientToSmartAccountSigner(walletClient),
                    factoryAddress: import.meta.env
                        .VITE_FACTORY_ADDRESS as Address,
                    entryPoint: import.meta.env.VITE_ENTRY_POINT as Address,
                    sponsorUserOperation: pimlicoClient.sponsorUserOperation
                })
                connect({ connector })
                break
            case "Safe":
                connector = await safeSmartAccount({
                    publicClient,
                    bundlerTransport: http(
                        import.meta.env.VITE_BUNDLER_RPC_HOST
                    ),
                    signer: walletClientToSmartAccountSigner(walletClient),
                    safeVersion: "1.4.1",
                    entryPoint: import.meta.env.VITE_ENTRY_POINT as Address,
                    sponsorUserOperation: pimlicoClient.sponsorUserOperation
                })
                connect({ connector })
                break
            case "Biconomy":
                connector = await biconomySmartAccount({
                    publicClient,
                    bundlerTransport: http(
                        import.meta.env.VITE_BUNDLER_RPC_HOST
                    ),
                    signer: walletClientToSmartAccountSigner(walletClient),
                    entryPoint: import.meta.env.VITE_ENTRY_POINT as Address,
                    sponsorUserOperation: pimlicoClient.sponsorUserOperation
                })
                connect({ connector })
                break

            case "Kernel":
                connector = await kernelSmartAccount({
                    publicClient,
                    bundlerTransport: http(
                        import.meta.env.VITE_BUNDLER_RPC_HOST
                    ),
                    signer: walletClientToSmartAccountSigner(walletClient),
                    entryPoint: import.meta.env.VITE_ENTRY_POINT as Address,
                    sponsorUserOperation: pimlicoClient.sponsorUserOperation
                })
                connect({ connector })
                break
        }
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
                {account.status === "connected" &&
                    smartAccounts.map((sa) => (
                        <button
                            style={{ marginLeft: 12 }}
                            key={sa}
                            onClick={() => connectSmartAccount(sa)}
                            type="button"
                        >
                            Custom {sa} smart account
                        </button>
                    ))}
                {account.status !== "connected" &&
                    connectors.map((connector) => (
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
