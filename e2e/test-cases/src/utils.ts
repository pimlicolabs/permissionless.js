import {
    type Chain,
    type Transport,
    createWalletClient,
    http,
    createPublicClient,
    parseEther,
    type Address,
    type WalletClient,
    type Account
} from "viem"
import { generatePrivateKey, mnemonicToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import {
    type BundlerClient,
    createBundlerClient,
    createSmartAccountClient,
    getEntryPointVersion,
    type SmartAccountClient
} from "permissionless"
import {
    type PimlicoPaymasterClient,
    createPimlicoBundlerClient,
    createPimlicoPaymasterClient
} from "permissionless/clients/pimlico"
import type { EntryPoint } from "permissionless/types"
import {
    type SmartAccount,
    privateKeyToSimpleSmartAccount
} from "permissionless/accounts"
import {
    SIMPLE_ACCOUNT_FACTORY_V07,
    SIMPLE_ACCOUNT_FACTORY_V06
} from "./constants"

export const fund = async (
    to: Address,
    funder: WalletClient<Transport, Chain, Account>
) => {
    await funder.sendTransaction({
        to,
        value: parseEther("1")
    })
}

export const setupSmartAccount = async <T extends EntryPoint>(
    entryPoint: T,
    paymasterClient?: PimlicoPaymasterClient<T>
): Promise<SmartAccountClient<T, Transport, Chain, SmartAccount<T>>> => {
    const publicClient = createPublicClient({
        transport: http(process.env.ANVIL_RPC),
        chain: foundry
    })

    const smartAccount = await privateKeyToSimpleSmartAccount<
        T,
        Transport,
        Chain
    >(publicClient, {
        entryPoint,
        privateKey: generatePrivateKey(),
        factoryAddress:
            getEntryPointVersion(entryPoint) === "v0.6"
                ? SIMPLE_ACCOUNT_FACTORY_V06
                : SIMPLE_ACCOUNT_FACTORY_V07
    })

    return createSmartAccountClient({
        chain: foundry,
        account: smartAccount,
        bundlerTransport: http(process.env.ALTO_RPC),
        middleware: {
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

export const getAnvilWalletClient = () => {
    return createWalletClient({
        account: mnemonicToAccount(
            "test test test test test test test test test test test junk"
        ),
        chain: foundry,
        transport: http(process.env.ANVIL_RPC)
    })
}

export const getPimlicoBundlerClient = (entryPoint: EntryPoint) => {
    return createPimlicoBundlerClient({
        chain: foundry,
        transport: http(process.env.ALTO_RPC),
        entryPoint: entryPoint
    })
}

export const getPimlicoPaymasterClient = (entryPoint: EntryPoint) => {
    return createPimlicoPaymasterClient({
        chain: foundry,
        transport: http(process.env.PAYMASTER_RPC),
        entryPoint
    })
}

export const getBundlerClient = <T extends EntryPoint>(
    entryPoint: T
): BundlerClient<T, Chain> =>
    createBundlerClient({
        chain: foundry,
        entryPoint,
        transport: http(process.env.ALTO_RPC)
    }) as BundlerClient<T, Chain>
