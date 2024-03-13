import { pimlicoPaymaster } from "@/config/pimlicoConfig"
import { createSmartAccountClient } from "permissionless"
import { type SmartAccountClient } from "permissionless"
import {
    type SafeSmartAccount,
    privateKeyToSafeSmartAccount
} from "permissionless/accounts"
import { http, type Address, type Chain } from "viem"
import { type PublicClient } from "viem"
import { usePublicClient } from "wagmi"
import { sepolia } from "wagmi"

export const createSafeAccount = async (publicClient: PublicClient) => {
    const safeAccount: SafeSmartAccount = await privateKeyToSafeSmartAccount(
        publicClient,
        {
            privateKey: "0xPRIVATE_KEY",
            safeVersion: "1.4.1",
            entryPoint: process.env.NEXT_PUBLIC_ENTRYPOINT as Address,
            saltNonce: 0n // optional
        }
    )
    return safeAccount
}

export const createSafeAccountClient = async (publicClient: PublicClient) => {
    const safeAccount = await createSafeAccount(publicClient)

    const smartAccountClient: SmartAccountClient = createSmartAccountClient({
        account: safeAccount,
        chain: sepolia,
        transport: http(process.env.NEXT_PUBLIC_BUNDLER_RPC_HOST),
        sponsorUserOperation: pimlicoPaymaster.sponsorUserOperation
    })

    return smartAccountClient
}
