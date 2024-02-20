import { pimlicoPaymasterConfig } from "@/config"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { usePrivyWagmi } from "@privy-io/wagmi-connector"
import {
    type SmartAccountClient,
    createSmartAccountClient
} from "permissionless"
import {
    type SmartAccount,
    SmartAccountSigner,
    signerToSafeSmartAccount
} from "permissionless/accounts"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
    http,
    type Address,
    type Chain,
    type Hash,
    type Transport,
    type WalletClient
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
    useAccount,
    useDisconnect,
    usePublicClient,
    useWalletClient
} from "wagmi"
import { sepolia } from "wagmi"

interface PrivyAuthHook {
    isConnected: boolean
    showLoader: boolean
    smartAccountClient: SmartAccountClient | null
    txHash: Hash | null
    signIn: () => Promise<void>
    signOut: () => Promise<void>
    onSendTransaction: (txHash: Hash) => void
    embeddedWallet: WalletClient
}

export const usePrivyAuth = (): PrivyAuthHook => {
    const signer = privateKeyToAccount("0xPRIVATE_KEY")
    const { login } = usePrivy()
    const { isConnected } = useAccount()
    const [showLoader, setShowLoader] = useState<boolean>(false)
    const [txHash, setTxHash] = useState<Hash | null>(null)
    const [smartAccountClient, setSmartAccountClient] =
        useState<SmartAccountClient<Transport, Chain, SmartAccount> | null>(
            null
        )

    const { disconnect } = useDisconnect()
    const publicClient = usePublicClient()

    const { wallets } = useWallets()

    const { data: walletClient } = useWalletClient()
    const { setActiveWallet } = usePrivyWagmi()

    const embeddedWallet = useMemo(
        () => wallets.find((wallet) => wallet.walletClientType === "privy"),
        [wallets]
    )

    useEffect(() => {
        setActiveWallet(embeddedWallet)
    }, [embeddedWallet, setActiveWallet])

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
            if (isConnected && walletClient && publicClient) {
                const safeAccount = await signerToSafeSmartAccount(
                    publicClient,
                    {
                        signer: signer as SmartAccountSigner<
                            "privateKey" | "custom",
                            `0x${string}`
                        >,
                        safeVersion: "1.4.1",
                        entryPoint: process.env
                            .NEXT_PUBLIC_ENTRYPOINT as Address,
                        saltNonce: 0n // optional
                    }
                )

                const smartAccountClient = createSmartAccountClient({
                    account: safeAccount,
                    chain: sepolia,
                    transport: http(process.env.NEXT_PUBLIC_BUNDLER_RPC_HOST),
                    sponsorUserOperation:
                        pimlicoPaymasterConfig.sponsorUserOperation
                })

                setSmartAccountClient(smartAccountClient)
            }
        })()
    }, [isConnected, walletClient, publicClient, signer])

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
