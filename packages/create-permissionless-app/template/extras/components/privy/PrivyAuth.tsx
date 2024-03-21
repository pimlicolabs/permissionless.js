import { usePrivyAuth } from "@/hooks/usePrivyAuth"
import React from "react"

export const PrivyAuth: React.FC = () => {
    const {
        isConnected,
        showLoader,
        smartAccountClient,
        signIn,
        signOut,
        embeddedWallet
    } = usePrivyAuth()

    if (isConnected && smartAccountClient && embeddedWallet) {
        return (
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col gap-4 items-center">
                    Smart contract wallet address:{" "}
                    <p className="justify-center border-b border-gray-300 backdrop-blur-2xl dark:border-neutral-800 w-auto rounded-xl border bg-gray-200 p-4 dark:bg-zinc-800/30">
                        <code>{smartAccountClient.account?.address}</code>
                    </p>
                </div>

                <button
                    type="button"
                    onClick={signOut}
                    className="flex justify-center items-center w-64 cursor-pointer border-2 border-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Sign out
                </button>
            </div>
        )
    }

    return (
        <button
            type="button"
            onClick={signIn}
            className="flex justify-center items-center w-64 cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
            {!showLoader && <p className="mr-4">Sign in with Privy</p>}
            {showLoader && <div>Loading...</div>}
        </button>
    )
}
