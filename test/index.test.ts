import type { Address } from "abitype"
import dotenv from "dotenv"
import {
    BundlerClient,
    type UserOperation,
    createBundlerClient,
    getSenderAddress,
    getUserOperationHash
} from "permissionless"
import { getAccountNonce } from "permissionless/actions"
import {
    PimlicoBundlerClient,
    PimlicoPaymasterClient,
    createPimlicoBundlerClient,
    createPimlicoPaymasterClient
} from "permissionless/clients/pimlico"
import { StackupPaymasterClient, createStackupPaymasterClient } from "permissionless/clients/stackup"
import {
    http,
    Hex,
    WalletClient,
    concatHex,
    createPublicClient,
    createWalletClient,
    encodeFunctionData,
    getContract,
    zeroAddress
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { goerli } from "viem/chains"
import { PartialBy } from "viem/types/utils"
import { EntryPointAbi } from "./abis/EntryPoint"
import { SimpleAccountAbi } from "./abis/SimpleAccount"
import { SimpleAccountFactoryAbi } from "./abis/SimpleAccountFactory"

// GOAL
// import { bundlerActions, pimlicoBundlerActions, pimlicoBundlerActions, pimlicoPaymasterActions } from "permissionless"
// import { pimlicoBundlerActions } from "permissionless/actions"
// clientInformation.extend(pim)

// Load environment variables from .env file
dotenv.config()

if (!process.env.PIMLICO_API_KEY) throw new Error("PIMLICO_API_KEY environment variable not set")
if (!process.env.ENTRYPOINT_ADDRESS) throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
if (!process.env.TEST_PRIVATE_KEY) throw new Error("TEST_PRIVATE_KEY environment variable not set")
if (!process.env.RPC_URL) throw new Error("RPC_URL environment variable not set")

const pimlicoApiKey = process.env.PIMLICO_API_KEY
const stackupApiKey = process.env.STACKUP_API_KEY
const entryPoint: Address = process.env.ENTRYPOINT_ADDRESS as Address

const chain = "goerli"
const account = privateKeyToAccount(process.env.TEST_PRIVATE_KEY as Hex)
const factoryAddress = "0x9406Cc6185a346906296840746125a0E44976454" as Address

const publicClient = createPublicClient({
    chain: goerli,
    transport: http(process.env.RPC_URL as string)
})

const entryPointContract = getContract({
    address: entryPoint,
    abi: EntryPointAbi,
    // Need to cast this as PublicClient or else it breaks ABI typing.
    // This is valid because our PublicClient is a subclass of PublicClient
    publicClient: publicClient
})

const getAccountInitCode = async (factoryAddress: Address, owner: WalletClient, index = 0n): Promise<Hex> => {
    if (!owner.account) throw new Error("Owner account not found")
    return concatHex([
        factoryAddress,
        encodeFunctionData({
            abi: SimpleAccountFactoryAbi,
            functionName: "createAccount",
            args: [owner.account.address, index]
        }) as Hex
    ])
}

const isAccountDeployed = async (accountAddress: Address) => {
    const contractCode = await publicClient.getBytecode({
        address: accountAddress
    })

    if ((contractCode?.length ?? 0) > 2) return true

    return false
}

const getInitCode = async (factoryAddress: Address, owner: WalletClient) => {
    const accountAddress = await getAccountAddress(factoryAddress, owner)
    if (!accountAddress) throw new Error("Account address not found")

    if (await isAccountDeployed(accountAddress)) return "0x"

    return getAccountInitCode(factoryAddress, owner)
}

const getAccountAddress = async (factoryAddress: Address, owner: WalletClient): Promise<Address | null> => {
    const initCode = await getAccountInitCode(factoryAddress, owner)

    return getSenderAddress(publicClient, {
        initCode,
        entryPoint
    })
}

const encodeExecute = async (target: Hex, value: bigint, data: Hex): Promise<`0x${string}`> => {
    return encodeFunctionData({
        abi: SimpleAccountAbi,
        functionName: "execute",
        args: [target, value, data]
    })
}

const getDummySignature = (): Hex => {
    return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
}

const testSupportedEntryPoints = async (bundlerClient: BundlerClient) => {
    const supportedEntryPoints = await bundlerClient.supportedEntryPoints()

    if (!supportedEntryPoints.includes(entryPoint)) throw new Error("Entry point not supported")
}

const testChainId = async (bundlerClient: BundlerClient) => {
    const chainId = await bundlerClient.chainId()

    if (chainId !== goerli.id) throw new Error("Chain ID not supported")
}

const buildUserOp = async (eoaWalletClient: WalletClient) => {
    const accountAddress = await getAccountAddress(factoryAddress, eoaWalletClient)

    if (!accountAddress) throw new Error("Account address not found")

    console.log("accountAddress", accountAddress)

    const nonce = await getAccountNonce(publicClient, {
        address: accountAddress,
        entryPoint: entryPoint
    })

    console.log("nonce", nonce)

    const oldNonce = await getAccountNonce(publicClient, {
        address: "0xc1020c634b737e177249ff4b2236e58c661e037f",
        entryPoint: entryPoint
    })

    console.log("old account nonce", oldNonce)

    const userOperation: PartialBy<
        UserOperation,
        "maxFeePerGas" | "maxPriorityFeePerGas" | "callGasLimit" | "verificationGasLimit" | "preVerificationGas"
    > = {
        sender: accountAddress,
        nonce: nonce,
        initCode: await getInitCode(factoryAddress, eoaWalletClient),
        callData: await encodeExecute(zeroAddress as Hex, 0n, "0x" as Hex),
        paymasterAndData: "0x" as Hex,
        signature: getDummySignature()
    }

    return userOperation
}

const testBundlerActions = async (bundlerClient: BundlerClient) => {
    console.log("======= TESTING BUNDLER ACTIONS =======")

    const eoaWalletClient = createWalletClient({
        account,
        chain: goerli,
        transport: http(process.env.RPC_URL as string)
    })

    console.log("======= TESTING SUPPORTED ENTRY POINTS =======")
    await testSupportedEntryPoints(bundlerClient)

    console.log("======= TESTING CHAIN ID =======")
    await testChainId(bundlerClient)

    const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas()

    const userOperation: UserOperation = {
        ...(await buildUserOp(eoaWalletClient)),
        maxFeePerGas: maxFeePerGas || 0n,
        maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
        callGasLimit: 0n,
        verificationGasLimit: 0n,
        preVerificationGas: 0n
    }

    console.log("======= TESTING ESTIMATE USER OPERATION GAS =======")
    const gasParameters = await bundlerClient.estimateUserOperationGas({
        userOperation,
        entryPoint: entryPoint as Address
    })

    userOperation.callGasLimit = gasParameters.callGasLimit
    userOperation.verificationGasLimit = gasParameters.verificationGasLimit
    userOperation.preVerificationGas = gasParameters.preVerificationGas

    console.log("======= TESTING SEND USER OPERATION =======")
    const signedUserOperation: UserOperation = {
        ...userOperation,
        signature: await eoaWalletClient.signMessage({
            account: eoaWalletClient.account,
            message: { raw: getUserOperationHash({ userOperation, entryPoint, chainId: goerli.id }) }
        })
    }

    const userOpHash = await bundlerClient.sendUserOperation({
        userOperation: signedUserOperation,
        entryPoint: entryPoint as Address
    })

    console.log("userOpHash", userOpHash)

    const userOpHashOld = "0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34"

    const userOperationFromUserOpHash = await bundlerClient.getUserOperationByHash({ hash: userOpHashOld })

    console.log("userOperationFromUserOpHash", userOperationFromUserOpHash)

    const userOperationReceiptFromUserOpHash = await bundlerClient.getUserOperationReceipt({ hash: userOpHashOld })

    console.log("userOperationReceiptFromUserOpHash", userOperationReceiptFromUserOpHash)
}

const getUserOperationGasPriceFromPimlicoBundler = async (pimlicoBundlerClient: PimlicoBundlerClient) => {
    return pimlicoBundlerClient.getUserOperationGasPrice()
}

const testFetchUserOperationStatus = async (pimlicoBundlerClient: PimlicoBundlerClient) => {
    const userOpHashOld = "0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34"

    const userOperationStatus = await pimlicoBundlerClient.getUserOperationStatus({
        hash: userOpHashOld
    })

    console.log(userOperationStatus)
}

const testPimlicoBundlerActions = async (pimlicoBundlerClient: PimlicoBundlerClient) => {
    console.log("======= TESTING PIMLICO BUNDLER ACTIONS =======")

    console.log("======= TESTING PIMLICO GET USER OPERATION GAS PRICE =======")

    await getUserOperationGasPriceFromPimlicoBundler(pimlicoBundlerClient)

    testFetchUserOperationStatus(pimlicoBundlerClient)
}

const testPimlicoPaymasterActions = async (
    pimlicoPaymasterClient: PimlicoPaymasterClient,
    bundlerClient: BundlerClient
) => {
    console.log("======= TESTING PIMLICO PAYMASTER ACTIONS =======")

    const eoaWalletClient = createWalletClient({
        account,
        chain: goerli,
        transport: http(process.env.RPC_URL as string)
    })

    const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas()

    const userOperation: UserOperation = {
        ...(await buildUserOp(eoaWalletClient)),
        maxFeePerGas: maxFeePerGas || 0n,
        maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
        paymasterAndData: "0x",
        callGasLimit: 0n,
        verificationGasLimit: 0n,
        preVerificationGas: 0n
    }

    const sponsorUserOperationPaymasterAndData = await pimlicoPaymasterClient.sponsorUserOperation({
        userOperation: userOperation,
        entryPoint: entryPoint as Address
    })
    console.log("sponsorUserOperationPaymasterAndData", sponsorUserOperationPaymasterAndData)

    userOperation.paymasterAndData = sponsorUserOperationPaymasterAndData.paymasterAndData
    userOperation.callGasLimit = sponsorUserOperationPaymasterAndData.callGasLimit
    userOperation.verificationGasLimit = sponsorUserOperationPaymasterAndData.verificationGasLimit
    userOperation.preVerificationGas = sponsorUserOperationPaymasterAndData.preVerificationGas

    console.log(userOperation, "============= USER OPERATION =============")

    const userOperationHash = getUserOperationHash({ userOperation, entryPoint, chainId: goerli.id })

    console.log(userOperationHash, "============= USER OPERATION HASH =============")

    const signedUserOperation: UserOperation = {
        ...userOperation,
        signature: await eoaWalletClient.signMessage({
            account: eoaWalletClient.account,
            message: { raw: userOperationHash }
        })
    }
    console.log(signedUserOperation, "============= SIGNED USER OPERATION HASH =============")

    const userOpHash = await bundlerClient.sendUserOperation({
        userOperation: signedUserOperation,
        entryPoint: entryPoint as Address
    })

    console.log("userOpHash", userOpHash)
}

const testStackupBundlerActions = async (
    stackupBundlerClient: StackupPaymasterClient,
    bundlerClient: BundlerClient
) => {
    console.log("======= TESTING STACKUP PAYMASTER ACTIONS =======")
    const supportedPaymasters = await stackupBundlerClient.accounts({ entryPoint })
    console.log("PAYMASTER ADDRESSES: ", supportedPaymasters)

    const eoaWalletClient = createWalletClient({
        account,
        chain: goerli,
        transport: http(process.env.RPC_URL as string)
    })

    const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas()

    const userOperation: UserOperation = {
        ...(await buildUserOp(eoaWalletClient)),
        maxFeePerGas: maxFeePerGas || 0n,
        maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
        paymasterAndData: "0x",
        callGasLimit: 0n,
        verificationGasLimit: 0n,
        preVerificationGas: 0n
    }

    const sponsorUserOperationPaymasterAndData = await stackupBundlerClient.sponsorUserOperation({
        userOperation: userOperation,
        entryPoint: entryPoint as Address,
        context: {
            type: "payg"
        }
    })

    userOperation.paymasterAndData = sponsorUserOperationPaymasterAndData.paymasterAndData
    userOperation.callGasLimit = sponsorUserOperationPaymasterAndData.callGasLimit
    userOperation.verificationGasLimit = sponsorUserOperationPaymasterAndData.verificationGasLimit
    userOperation.preVerificationGas = sponsorUserOperationPaymasterAndData.preVerificationGas

    console.log(userOperation, "============= USER OPERATION =============")

    const userOperationHash = getUserOperationHash({ userOperation, entryPoint, chainId: goerli.id })

    console.log(userOperationHash, "============= USER OPERATION HASH =============")

    const signedUserOperation: UserOperation = {
        ...userOperation,
        signature: await eoaWalletClient.signMessage({
            account: eoaWalletClient.account,
            message: { raw: userOperationHash }
        })
    }
    console.log(signedUserOperation, "============= SIGNED USER OPERATION HASH =============")

    const userOpHash = await bundlerClient.sendUserOperation({
        userOperation: signedUserOperation,
        entryPoint: entryPoint as Address
    })

    console.log("userOpHash", userOpHash)
}

const main = async () => {
    const bundlerClient = createBundlerClient({
        chain: goerli,
        transport: http(`https://api.pimlico.io/v1/${chain}/rpc?apikey=${pimlicoApiKey}`)
    })

    await testBundlerActions(bundlerClient)

    const pimlicoBundlerClient = createPimlicoBundlerClient({
        chain: goerli,
        transport: http(`https://api.pimlico.io/v1/${chain}/rpc?apikey=${pimlicoApiKey}`)
    })
    await testPimlicoBundlerActions(pimlicoBundlerClient)

    const pimlicoPaymasterClient = createPimlicoPaymasterClient({
        chain: goerli,
        transport: http(`https://api.pimlico.io/v2/${chain}/rpc?apikey=${pimlicoApiKey}`)
    })
    await testPimlicoPaymasterActions(pimlicoPaymasterClient, bundlerClient)

    const stackupBundlerClient = createStackupPaymasterClient({
        chain: goerli,
        transport: http(`https://api.stackup.sh/v1/paymaster/${stackupApiKey}`)
    })

    await testStackupBundlerActions(stackupBundlerClient, bundlerClient)
}

main()

// bundlerClient.sendUserOperation({
//     userOperation,
//     entryPoint
// })
