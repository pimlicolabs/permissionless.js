import { pimlicoPaymasterConfig } from "@/config"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { useSetActiveWallet } from "@privy-io/wagmi"
import { useCallback, useEffect, useMemo, useState } from "react"

import {
    ENTRYPOINT_ADDRESS_V06,
    type SmartAccountClient,
    createSmartAccountClient,
    walletClientToSmartAccountSigner
} from "permissionless"
import { signerToSafeSmartAccount } from "permissionless/accounts"
import { http, type Hash } from "viem"
import { sepolia } from "viem/chains"
import {
    useAccount,
    useDisconnect,
    usePublicClient,
    useWalletClient
} from "wagmi"

export const usePrivyAuth = () => {
    const { login } = usePrivy()
    const { isConnected } = useAccount()
    const [showLoader, setShowLoader] = useState<boolean>(false)
    const [txHash, setTxHash] = useState<Hash | null>(null)

    const [smartAccountClient, setSmartAccountClient] = useState<
        SmartAccountClient<typeof ENTRYPOINT_ADDRESS_V06> | undefined
    >()

    const { disconnect } = useDisconnect()
    const publicClient = usePublicClient()

    const { wallets } = useWallets()

    const { data: walletClient } = useWalletClient()
    const { setActiveWallet } = useSetActiveWallet()

    const embeddedWallet = wallets.find(
        (wallet) => wallet.walletClientType === "privy"
    )

    const signIn = useCallback(async () => {
        setShowLoader(true)
        login()
    }, [login])

    const signOut = useCallback(async () => {
        setShowLoader(false)
        disconnect()
    }, [disconnect])

    useEffect(() => {
        ;(async () => {
            if (isConnected && walletClient && publicClient && embeddedWallet) {
                setActiveWallet(embeddedWallet)
                const signer = walletClientToSmartAccountSigner(walletClient)
                const safeAccount = await signerToSafeSmartAccount(
                    publicClient,
                    {
                        signer: signer,
                        safeVersion: "1.4.1",
                        entryPoint: ENTRYPOINT_ADDRESS_V06,
                        saltNonce: 0n // optional
                    }
                )

                const smartAccountClient = createSmartAccountClient({
                    account: safeAccount,
                    entryPoint: ENTRYPOINT_ADDRESS_V06,
                    chain: sepolia,
                    bundlerTransport: http(
                        process.env.NEXT_PUBLIC_BUNDLER_RPC_HOST
                    ),
                    middleware: {
                        sponsorUserOperation:
                            pimlicoPaymasterConfig.sponsorUserOperation // optional
                    }
                })

                setSmartAccountClient(smartAccountClient)
            }
        })()
    }, [
        isConnected,
        walletClient,
        publicClient,
        embeddedWallet,
        setActiveWallet
    ])

    const onSendTransaction = (txHash: Hash) => {
        setTxHash(txHash)
    }

    return {
        isConnected,
        showLoader,
        smartAccountClient,
        txHash,
        signIn,
        signOut,
        onSendTransaction,
        embeddedWallet
    }
}
