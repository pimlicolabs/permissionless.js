import type { Address } from "abitype"
import dotenv from "dotenv"
import { BundlerClient, type UserOperation, createBundlerClient } from "permissionless"
import {
    PimlicoBundlerClient,
    PimlicoPaymasterClient,
    createPimlicoBundlerClient,
    createPimlicoPaymasterClient
} from "permissionless/clients/pimlico"
import {
    http,
    Hex,
    HttpTransport,
    WalletClient,
    concatHex,
    createPublicClient,
    createWalletClient,
    encodeAbiParameters,
    encodeFunctionData,
    getContract,
    keccak256,
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
const entryPoint: Address = process.env.ENTRYPOINT_ADDRESS as Address

const chain = "goerli"
const account = privateKeyToAccount(process.env.TEST_PRIVATE_KEY as Address)
const factoryAddress = "0x9406Cc6185a346906296840746125a0E44976454" as Address

const publicClient = createPublicClient<HttpTransport, typeof goerli>({
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

    try {
        await entryPointContract.simulate.getSenderAddress([initCode])
    } catch (err) {
        if (err.cause?.data?.errorName === "SenderAddressResult") {
            return err.cause.data.args[0] as Address
        }
    }
    return null
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

function packUserOp(userOperation: UserOperation): Hex {
    const hashedInitCode = keccak256(userOperation.initCode)
    const hashedCallData = keccak256(userOperation.callData)
    const hashedPaymasterAndData = keccak256(userOperation.paymasterAndData)

    return encodeAbiParameters(
        [
            { type: "address" },
            { type: "uint256" },
            { type: "bytes32" },
            { type: "bytes32" },
            { type: "uint256" },
            { type: "uint256" },
            { type: "uint256" },
            { type: "uint256" },
            { type: "uint256" },
            { type: "bytes32" }
        ],
        [
            userOperation.sender as Address,
            userOperation.nonce,
            hashedInitCode,
            hashedCallData,
            userOperation.callGasLimit,
            userOperation.verificationGasLimit,
            userOperation.preVerificationGas,
            userOperation.maxFeePerGas,
            userOperation.maxPriorityFeePerGas,
            hashedPaymasterAndData
        ]
    )
}

const getUserOperationHash = (userOperation: UserOperation, entryPointAddress: Address, chainId: bigint) => {
    const encoded = encodeAbiParameters(
        [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
        [keccak256(packUserOp(userOperation)), entryPointAddress, chainId]
    ) as `0x${string}`

    return keccak256(encoded)
}

const getNonce = async (accountAddress: Address): Promise<bigint> => {
    if (!(await isAccountDeployed(accountAddress))) {
        return 0n
    }
    return entryPointContract.read.getNonce([accountAddress, BigInt(0)])
}

const testSupportedEntryPoints = async (bundlerClient: BundlerClient) => {
    const supportedEntryPoints = await bundlerClient.supportedEntryPoints()

    if (!supportedEntryPoints.includes(entryPoint)) throw new Error("Entry point not supported")
}

const testChainId = async (bundlerClient: BundlerClient) => {
    const chainId = await bundlerClient.chainId()

    if (chainId !== BigInt(goerli.id)) throw new Error("Chain ID not supported")
}

const buildUserOp = async (eoaWalletClient: WalletClient) => {
    const accountAddress = await getAccountAddress(factoryAddress, eoaWalletClient)

    if (!accountAddress) throw new Error("Account address not found")

    const userOperation: PartialBy<
        UserOperation,
        "maxFeePerGas" | "maxPriorityFeePerGas" | "callGasLimit" | "verificationGasLimit" | "preVerificationGas"
    > = {
        sender: accountAddress,
        nonce: await getNonce(accountAddress),
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
            message: { raw: getUserOperationHash(userOperation, entryPoint, BigInt(goerli.id)) }
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

const testFetUserOperationStatus = async (pimlicoBundlerClient: PimlicoBundlerClient) => {
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

    testFetUserOperationStatus(pimlicoBundlerClient)
}

const testPimlicoPaymasterActions = async (pimlicoPaymasterClient: PimlicoPaymasterClient) => {
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
    await testPimlicoPaymasterActions(pimlicoPaymasterClient)
}

main()

// bundlerClient.sendUserOperation({
//     userOperation,
//     entryPoint
// })
