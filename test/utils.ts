import { createBundlerClient, createSmartAccountClient } from "permissionless"
import {
    SmartAccount,
    signerToEcdsaKernelSmartAccount,
    signerToSafeSmartAccount,
    signerToSimpleSmartAccount
} from "permissionless/accounts"
import { SponsorUserOperationMiddleware } from "permissionless/actions/smartAccount"
import {
    createPimlicoBundlerClient,
    createPimlicoPaymasterClient
} from "permissionless/clients/pimlico"
import {
    http,
    Address,
    Hex,
    createPublicClient,
    createWalletClient,
    encodeFunctionData
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { goerli, polygonMumbai } from "viem/chains"
import * as allChains from "viem/chains"

export const getFactoryAddress = () => {
    if (!process.env.FACTORY_ADDRESS)
        throw new Error("FACTORY_ADDRESS environment variable not set")
    const factoryAddress = process.env.FACTORY_ADDRESS as Address
    return factoryAddress
}

export const getPrivateKeyAccount = () => {
    if (!process.env.TEST_PRIVATE_KEY)
        throw new Error("TEST_PRIVATE_KEY environment variable not set")
    return privateKeyToAccount(process.env.TEST_PRIVATE_KEY as Hex)
}

export const getTestingChain = () => {
    // If custom chain specified in environment variable, use that
    if (process.env.TEST_CHAIN_ID) {
        const chainId = parseInt(process.env.TEST_CHAIN_ID)
        const chain = Object.values(allChains).find(
            (chain) => chain.id === chainId
        )
        if (chain) return chain
    }

    // Otherwise, use fallback to goerli
    return goerli
}

export const getSignerToSimpleSmartAccount = async () => {
    if (!process.env.TEST_PRIVATE_KEY)
        throw new Error("TEST_PRIVATE_KEY environment variable not set")

    const publicClient = await getPublicClient()

    const signer = privateKeyToAccount(process.env.TEST_PRIVATE_KEY as Hex)

    return await signerToSimpleSmartAccount(publicClient, {
        entryPoint: getEntryPoint(),
        factoryAddress: getFactoryAddress(),
        signer: signer
    })
}

export const getSignerToSafeSmartAccount = async (args?: {
    setupTransactions?: {
        to: Address
        data: Address
        value: bigint
    }[]
}) => {
    if (!process.env.TEST_PRIVATE_KEY)
        throw new Error("TEST_PRIVATE_KEY environment variable not set")

    const publicClient = await getPublicClient()

    const signer = privateKeyToAccount(process.env.TEST_PRIVATE_KEY as Hex)

    return await signerToSafeSmartAccount(publicClient, {
        entryPoint: getEntryPoint(),
        signer: signer,
        safeVersion: "1.4.1",
        saltNonce: 100n,
        setupTransactions: args?.setupTransactions
    })
}
export const getSignerToEcdsaKernelAccount = async () => {
    if (!process.env.TEST_PRIVATE_KEY)
        throw new Error("TEST_PRIVATE_KEY environment variable not set")

    const publicClient = await getPublicClient()
    const signer = privateKeyToAccount(process.env.TEST_PRIVATE_KEY as Hex)

    return await signerToEcdsaKernelSmartAccount(publicClient, {
        entryPoint: getEntryPoint(),
        signer: signer,
        index: 100n
    })
}

export const getSmartAccountClient = async ({
    account,
    sponsorUserOperation
}: SponsorUserOperationMiddleware & { account?: SmartAccount } = {}) => {
    if (!process.env.PIMLICO_API_KEY)
        throw new Error("PIMLICO_API_KEY environment variable not set")
    if (!process.env.PIMLICO_BUNDLER_RPC_HOST)
        throw new Error("PIMLICO_BUNDLER_RPC_HOST environment variable not set")
    const pimlicoApiKey = process.env.PIMLICO_API_KEY
    const chain = getTestingChain()

    return createSmartAccountClient({
        account: account ?? (await getSignerToSimpleSmartAccount()),
        chain,
        transport: http(
            `${process.env.PIMLICO_BUNDLER_RPC_HOST}?apikey=${pimlicoApiKey}`
        ),
        sponsorUserOperation
    })
}

export const getEoaWalletClient = () => {
    return createWalletClient({
        account: getPrivateKeyAccount(),
        chain: getTestingChain(),
        transport: http(process.env.RPC_URL as string)
    })
}

export const getEntryPoint = () => {
    if (!process.env.ENTRYPOINT_ADDRESS)
        throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
    return process.env.ENTRYPOINT_ADDRESS as Address
}

export const getPublicClient = async () => {
    if (!process.env.RPC_URL)
        throw new Error("RPC_URL environment variable not set")

    const publicClient = createPublicClient({
        transport: http(process.env.RPC_URL as string)
    })

    const chainId = await publicClient.getChainId()

    if (chainId !== getTestingChain().id)
        throw new Error("Testing Chain ID not supported by RPC URL")

    return publicClient
}

export const getBundlerClient = () => {
    if (!process.env.PIMLICO_API_KEY)
        throw new Error("PIMLICO_API_KEY environment variable not set")
    if (!process.env.PIMLICO_BUNDLER_RPC_HOST)
        throw new Error("PIMLICO_BUNDLER_RPC_HOST environment variable not set")
    const pimlicoApiKey = process.env.PIMLICO_API_KEY

    const chain = getTestingChain()

    return createBundlerClient({
        chain: chain,
        transport: http(
            `${process.env.PIMLICO_BUNDLER_RPC_HOST}?apikey=${pimlicoApiKey}`
        )
    })
}

export const getPimlicoBundlerClient = () => {
    if (!process.env.PIMLICO_BUNDLER_RPC_HOST)
        throw new Error("PIMLICO_BUNDLER_RPC_HOST environment variable not set")
    if (!process.env.PIMLICO_API_KEY)
        throw new Error("PIMLICO_API_KEY environment variable not set")
    const pimlicoApiKey = process.env.PIMLICO_API_KEY

    const chain = getTestingChain()

    return createPimlicoBundlerClient({
        chain: chain,
        transport: http(
            `${process.env.PIMLICO_BUNDLER_RPC_HOST}?apikey=${pimlicoApiKey}`
        )
    })
}

export const getPimlicoPaymasterClient = () => {
    if (!process.env.PIMLICO_PAYMASTER_RPC_HOST)
        throw new Error(
            "PIMLICO_PAYMASTER_RPC_HOST environment variable not set"
        )
    if (!process.env.PIMLICO_API_KEY)
        throw new Error("PIMLICO_API_KEY environment variable not set")
    const pimlicoApiKey = process.env.PIMLICO_API_KEY

    const chain = getTestingChain()

    return createPimlicoPaymasterClient({
        chain: chain,
        transport: http(
            `${process.env.PIMLICO_PAYMASTER_RPC_HOST}?apikey=${pimlicoApiKey}`
        )
    })
}

export const isAccountDeployed = async (accountAddress: Address) => {
    const publicClient = await getPublicClient()

    const contractCode = await publicClient.getBytecode({
        address: accountAddress
    })

    if ((contractCode?.length ?? 0) > 2) return true

    return false
}

export const getDummySignature = (): Hex => {
    return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
}

export const getOldUserOpHash = (): Hex => {
    return "0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34"
}

export const waitForNonceUpdate = async () => {
    return new Promise((res) => {
        setTimeout(res, 10000)
    })
}

export const generateApproveCallData = (paymasterAddress: Address) => {
    const approveData = encodeFunctionData({
        abi: [
            {
                inputs: [
                    { name: "_spender", type: "address" },
                    { name: "_value", type: "uint256" }
                ],
                name: "approve",
                outputs: [{ name: "", type: "bool" }],
                payable: false,
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        args: [
            paymasterAddress,
            0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
        ]
    })

    return approveData
}
