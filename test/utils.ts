import { createBundlerClient, createSmartAccountClient } from "permissionless"
import {
    SmartAccount,
    privateKeyToSafeSmartAccount,
    privateKeyToSimpleSmartAccount
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
    createWalletClient
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { goerli } from "viem/chains"

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
    return goerli
}

export const getPrivateKeyToSimpleSmartAccount = async () => {
    if (!process.env.TEST_PRIVATE_KEY)
        throw new Error("TEST_PRIVATE_KEY environment variable not set")

    const publicClient = await getPublicClient()

    return await privateKeyToSimpleSmartAccount(publicClient, {
        entryPoint: getEntryPoint(),
        factoryAddress: getFactoryAddress(),
        privateKey: process.env.TEST_PRIVATE_KEY as Hex
    })
}

export const getPrivateKeyToSafeSmartAccount = async () => {
    if (!process.env.TEST_PRIVATE_KEY)
        throw new Error("TEST_PRIVATE_KEY environment variable not set")

    const publicClient = await getPublicClient()

    return await privateKeyToSafeSmartAccount(publicClient, {
        entryPoint: getEntryPoint(),
        privateKey: process.env.TEST_PRIVATE_KEY as Hex,
        safeVersion: "1.4.1",
        saltNonce: 100n
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
        account: account ?? (await getPrivateKeyToSimpleSmartAccount()),
        chain,
        transport: http(
            `${
                process.env.PIMLICO_BUNDLER_RPC_HOST
            }/v1/${chain.name.toLowerCase()}/rpc?apikey=${pimlicoApiKey}`
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
            `${
                process.env.PIMLICO_BUNDLER_RPC_HOST
            }/v1/${chain.name.toLowerCase()}/rpc?apikey=${pimlicoApiKey}`
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
            `${
                process.env.PIMLICO_BUNDLER_RPC_HOST
            }/v1/${chain.name.toLowerCase()}/rpc?apikey=${pimlicoApiKey}`
        )
    })
}

export const getPimlicoPaymasterClient = () => {
    if (!process.env.PIMLICO_BUNDLER_RPC_HOST)
        throw new Error("PIMLICO_BUNDLER_RPC_HOST environment variable not set")
    if (!process.env.PIMLICO_API_KEY)
        throw new Error("PIMLICO_API_KEY environment variable not set")
    const pimlicoApiKey = process.env.PIMLICO_API_KEY

    const chain = getTestingChain()

    return createPimlicoPaymasterClient({
        chain: chain,
        transport: http(
            `${
                process.env.PIMLICO_BUNDLER_RPC_HOST
            }/v2/${chain.name.toLowerCase()}/rpc?apikey=${pimlicoApiKey}`
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
