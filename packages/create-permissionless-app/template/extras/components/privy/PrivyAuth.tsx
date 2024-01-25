import { usePrivyFlow } from "@/hooks/usePrivyFlow"
import React from "react"

export const PrivyAuth: React.FC = () => {
    const {
        isConnected,
        showLoader,
        smartAccountClient,
        signIn,
        signOut,
        embeddedWallet
    } = usePrivyFlow()

    if (isConnected && smartAccountClient && embeddedWallet) {
        return (
            <div>
                <div>
                    Smart contract wallet address:{" "}
                    <p className="fixed left-0 top-0 flex flex-col w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                        <code>{smartAccountClient.account?.address}</code>
                    </p>
                </div>
                <div className="flex gap-x-4">
                    <button
                        type="button"
                        onClick={signOut}
                        className="mt-6 flex justify-center items-center w-64 cursor-pointer border-2 border-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Sign out
                    </button>
                </div>
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
