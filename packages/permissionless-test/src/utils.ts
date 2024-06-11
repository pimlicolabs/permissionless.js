import {
    type BundlerClient,
    ENTRYPOINT_ADDRESS_V06,
    type SmartAccountClient,
    createBundlerClient,
    createSmartAccountClient,
    getEntryPointVersion
} from "permissionless"
import {
    type SafeSmartAccount,
    type SmartAccount,
    signerToBiconomySmartAccount,
    signerToEcdsaKernelSmartAccount,
    signerToLightSmartAccount,
    signerToSafeSmartAccount,
    signerToSimpleSmartAccount
} from "permissionless/accounts"
import type { KernelEcdsaSmartAccount } from "permissionless/accounts"
import {
    type PimlicoBundlerClient,
    type PimlicoPaymasterClient,
    createPimlicoBundlerClient,
    createPimlicoPaymasterClient
} from "permissionless/clients/pimlico"
import { paymasterActionsEip7677 } from "permissionless/experimental"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    EntryPoint
} from "permissionless/types"
import {
    http,
    type Account,
    type Address,
    type Chain,
    type Hex,
    type Transport,
    type WalletClient,
    createClient,
    createPublicClient,
    createWalletClient,
    parseEther
} from "viem"
import {
    generatePrivateKey,
    mnemonicToAccount,
    privateKeyToAccount
} from "viem/accounts"
import { foundry } from "viem/chains"
import {
    SIMPLE_ACCOUNT_FACTORY_V06,
    SIMPLE_ACCOUNT_FACTORY_V07
} from "./constants"
import type { AAParamType } from "./types"

export const PAYMASTER_RPC = "http://localhost:3000"

export const ensureBundlerIsReady = async (altoRpc: string) => {
    const bundlerClient = getBundlerClient({
        entryPoint: ENTRYPOINT_ADDRESS_V06,
        altoRpc: altoRpc
    })

    while (true) {
        try {
            await bundlerClient.chainId()
            return
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }
}

export const ensurePaymasterIsReady = async () => {
    while (true) {
        try {
            const res = await fetch(`${PAYMASTER_RPC}/ping`)
            const data = await res.json()
            if (data.message !== "pong") {
                throw new Error("nope")
            }

            return
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }
}

export const getAnvilWalletClient = ({
    addressIndex,
    anvilRpc
}: { addressIndex: number; anvilRpc: string }) => {
    return createWalletClient({
        account: mnemonicToAccount(
            "test test test test test test test test test test test junk",
            {
                addressIndex
            }
        ),
        chain: foundry,
        transport: http(anvilRpc)
    })
}

export const getPimlicoPaymasterClient = <T extends EntryPoint>(
    entryPoint: T
): PimlicoPaymasterClient<T> => {
    return createPimlicoPaymasterClient({
        chain: foundry,
        transport: http(PAYMASTER_RPC),
        entryPoint
    })
}

export const getBundlerClient = <T extends EntryPoint>({
    entryPoint,
    altoRpc
}: { entryPoint: T; altoRpc: string }): BundlerClient<T, Chain> =>
    createBundlerClient({
        chain: foundry,
        entryPoint,
        transport: http(altoRpc)
    }) as BundlerClient<T, Chain>

export const getPimlicoBundlerClient = <T extends EntryPoint>({
    entryPoint,
    altoRpc
}: { entryPoint: T; altoRpc: string }): PimlicoBundlerClient<T> =>
    createPimlicoBundlerClient({
        chain: foundry,
        entryPoint,
        transport: http(altoRpc)
    })

export const getPublicClient = (anvilRpc: string) => {
    return createPublicClient({
        chain: foundry,
        transport: http(anvilRpc),
        pollingInterval: 100
    })
}

const usedWallets = new Set<Address>()

export const fund = async ({
    to,
    anvilRpc
}: { to: Address; anvilRpc: string }) => {
    let funder: WalletClient<Transport, Chain, Account>

    const wallets = Array.from({ length: 10 }, (_, index) =>
        getAnvilWalletClient({ addressIndex: index, anvilRpc })
    )
    const publicClient = getPublicClient(anvilRpc)

    do {
        const availableFunders = wallets.filter(
            (wallet) => !usedWallets.has(wallet.account.address)
        )
        const randomIndex = Math.floor(Math.random() * availableFunders.length)
        funder = availableFunders[randomIndex]
    } while (!funder)

    // mark the funder as used
    usedWallets.add(funder.account.address)

    const hash = await funder.sendTransaction({
        to,
        value: parseEther("1")
    })

    // wait for funding confirmation
    await publicClient.waitForTransactionReceipt({ hash })
}

export const getFactoryAddress = (
    entryPoint: EntryPoint,
    accountType: "simple" | "safe"
) => {
    switch (accountType) {
        case "simple":
            return getEntryPointVersion(entryPoint) === "v0.6"
                ? SIMPLE_ACCOUNT_FACTORY_V06
                : SIMPLE_ACCOUNT_FACTORY_V07
        case "safe":
            break
    }

    throw new Error("Parameters not recongized")
}

export const getSimpleAccountClient = async <T extends EntryPoint>({
    entryPoint,
    paymasterClient,
    anvilRpc,
    altoRpc,
    privateKey = generatePrivateKey()
}: AAParamType<T>): Promise<
    SmartAccountClient<T, Transport, Chain, SmartAccount<T>>
> => {
    const publicClient = getPublicClient(anvilRpc)

    const smartAccount = await signerToSimpleSmartAccount<T, Transport, Chain>(
        publicClient,
        {
            entryPoint,
            signer: privateKeyToAccount(privateKey),
            factoryAddress: getFactoryAddress(entryPoint, "simple")
        }
    )

    return createSmartAccountClient({
        chain: foundry,
        account: smartAccount,
        bundlerTransport: http(altoRpc),
        // @ts-ignore
        middleware: paymasterClient
            ? {
                  sponsorUserOperation: paymasterClient.sponsorUserOperation
              }
            : undefined
    })
}

export const getLightAccountClient = async <T extends EntryPoint>({
    entryPoint,
    paymasterClient,
    anvilRpc,
    altoRpc,
    privateKey = generatePrivateKey()
}: AAParamType<T>): Promise<
    SmartAccountClient<T, Transport, Chain, SmartAccount<T>>
> => {
    const publicClient = getPublicClient(anvilRpc)
    const smartAccount = await signerToLightSmartAccount(publicClient, {
        entryPoint,
        signer: privateKeyToAccount(privateKey),
        lightAccountVersion: "1.1.0"
    })

    return createSmartAccountClient({
        chain: foundry,
        account: smartAccount,
        bundlerTransport: http(altoRpc),
        entryPoint: entryPoint,
        // eip7677Client: await getEip7677Client({ entryPoint }),
        middleware: {
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}
// Only supports v0.6 for now
export const getBiconomyClient = async ({
    paymasterClient,
    privateKey = generatePrivateKey(),
    anvilRpc,
    altoRpc,
    entryPoint = ENTRYPOINT_ADDRESS_V06
}: AAParamType<ENTRYPOINT_ADDRESS_V06_TYPE>) => {
    const publicClient = getPublicClient(anvilRpc)
    const ecdsaSmartAccount = await signerToBiconomySmartAccount(publicClient, {
        entryPoint,
        signer: privateKeyToAccount(privateKey)
    })

    // @ts-ignore
    return createSmartAccountClient({
        account: ecdsaSmartAccount,
        chain: foundry,
        bundlerTransport: http(altoRpc),
        middleware: {
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

export const getKernelEcdsaClient = async <T extends EntryPoint>({
    entryPoint,
    paymasterClient,
    anvilRpc,
    altoRpc,
    privateKey = generatePrivateKey()
}: AAParamType<T>): Promise<
    SmartAccountClient<T, Transport, Chain, KernelEcdsaSmartAccount<T>>
> => {
    const publicClient = getPublicClient(anvilRpc)
    const kernelEcdsaAccount = await signerToEcdsaKernelSmartAccount(
        publicClient,
        {
            entryPoint,
            signer: privateKeyToAccount(privateKey)
        }
    )

    // @ts-ignore
    return createSmartAccountClient({
        chain: foundry,
        account: kernelEcdsaAccount,
        bundlerTransport: http(altoRpc),
        middleware: {
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

export const getSafeClient = async <T extends EntryPoint>({
    setupTransactions = [],
    entryPoint,
    paymasterClient,
    anvilRpc,
    altoRpc,
    privateKey = generatePrivateKey()
}: {
    setupTransactions?: {
        to: Address
        data: Address
        value: bigint
    }[]
    anvilRpc: string
    altoRpc: string
    entryPoint: T
    paymasterClient?: PimlicoPaymasterClient<T>
    privateKey?: Hex
}): Promise<SmartAccountClient<T, Transport, Chain, SafeSmartAccount<T>>> => {
    const publicClient = getPublicClient(anvilRpc)
    const safeSmartAccount = await signerToSafeSmartAccount(publicClient, {
        entryPoint,
        signer: privateKeyToAccount(privateKey),
        safeVersion: "1.4.1",
        saltNonce: 420n,
        setupTransactions
    })

    // @ts-ignore
    return createSmartAccountClient({
        chain: foundry,
        account: safeSmartAccount,
        bundlerTransport: http(altoRpc),
        middleware: {
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

export const getEip7677Client = async <TEntryPoint extends EntryPoint>({
    entryPoint
}: { entryPoint: TEntryPoint }) => {
    const client = createClient({
        chain: foundry,
        transport: http(PAYMASTER_RPC)
    }).extend(paymasterActionsEip7677(entryPoint))

    return client
}
