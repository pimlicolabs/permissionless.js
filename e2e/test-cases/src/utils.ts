import {
    type BundlerClient,
    type SmartAccountClient,
    createBundlerClient,
    createSmartAccountClient,
    getEntryPointVersion,
    ENTRYPOINT_ADDRESS_V06
} from "permissionless"
import {
    type SafeSmartAccount,
    type SmartAccount,
    privateKeyToSimpleSmartAccount,
    signerToSafeSmartAccount,
    signerToBiconomySmartAccount
} from "permissionless/accounts"
import {
    type PimlicoBundlerClient,
    type PimlicoPaymasterClient,
    createPimlicoBundlerClient,
    createPimlicoPaymasterClient
} from "permissionless/clients/pimlico"
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

export const getAnvilWalletClient = (addressIndex: number) => {
    return createWalletClient({
        account: mnemonicToAccount(
            "test test test test test test test test test test test junk",
            {
                addressIndex
            }
        ),
        chain: foundry,
        transport: http(process.env.ANVIL_RPC)
    })
}

export const getPimlicoPaymasterClient = <T extends EntryPoint>(
    entryPoint: T
): PimlicoPaymasterClient<T> => {
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

export const getPimlicoBundlerClient = <T extends EntryPoint>(
    entryPoint: T
): PimlicoBundlerClient<T> =>
    createPimlicoBundlerClient({
        chain: foundry,
        entryPoint,
        transport: http(process.env.ALTO_RPC)
    })

export const getPublicClient = () => {
    return createPublicClient({
        chain: foundry,
        transport: http(process.env.ANVIL_RPC)
    })
}

const publicClient = getPublicClient()

export const fund = async (
    to: Address,
    funder: WalletClient<Transport, Chain, Account>
) => {
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

export const setupSimpleSmartAccountClient = async <T extends EntryPoint>({
    entryPoint,
    privateKey = generatePrivateKey(),
    paymasterClient,
    pimlicoBundlerClient
}: {
    entryPoint: T
    privateKey?: Hex
    paymasterClient?: PimlicoPaymasterClient<T>
    pimlicoBundlerClient?: PimlicoBundlerClient<T>
}): Promise<SmartAccountClient<T, Transport, Chain, SmartAccount<T>>> => {
    const smartAccount = await privateKeyToSimpleSmartAccount<
        T,
        Transport,
        Chain
    >(publicClient, {
        entryPoint,
        privateKey,
        factoryAddress: getFactoryAddress(entryPoint, "simple")
    })

    // @ts-ignore
    return createSmartAccountClient({
        chain: foundry,
        account: smartAccount,
        bundlerTransport: http(process.env.ALTO_RPC),
        middleware: {
            gasPrice: pimlicoBundlerClient
                ? async () => {
                      return (
                          await pimlicoBundlerClient.getUserOperationGasPrice()
                      ).fast
                  }
                : undefined,
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

// Only supports v0.6 for now
export const setupEcdsaBiconomySmartAccountClient = async ({
    paymasterClient,
    privateKey = generatePrivateKey()
}: {
    paymasterClient?: PimlicoPaymasterClient<ENTRYPOINT_ADDRESS_V06_TYPE>
    privateKey?: Hex
}) => {
    const ecdsaSmartAccount = await signerToBiconomySmartAccount(publicClient, {
        entryPoint: ENTRYPOINT_ADDRESS_V06,
        signer: privateKeyToAccount(privateKey)
    })

    return createSmartAccountClient({
        account: ecdsaSmartAccount,
        chain: foundry,
        bundlerTransport: http(process.env.ALTO_RPC),
        middleware: {
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

export const setupSafeSmartAccountClient = async <T extends EntryPoint>({
    setupTransactions = [],
    entryPoint,
    paymasterClient
}: {
    setupTransactions?: {
        to: Address
        data: Address
        value: bigint
    }[]
    entryPoint: T
    paymasterClient?: PimlicoPaymasterClient<T>
}): Promise<SmartAccountClient<T, Transport, Chain, SafeSmartAccount<T>>> => {
    const safeSmartAccount = await signerToSafeSmartAccount(publicClient, {
        entryPoint,
        signer: privateKeyToAccount(generatePrivateKey()),
        safeVersion: "1.4.1",
        saltNonce: 420n,
        setupTransactions
    })

    // @ts-ignore
    return createSmartAccountClient({
        chain: foundry,
        account: safeSmartAccount,
        bundlerTransport: http(process.env.ALTO_RPC),
        middleware: {
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}
