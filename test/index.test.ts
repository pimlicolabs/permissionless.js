import { EntryPointAbi } from "./abis/EntryPoint"
import { SimpleAccountAbi } from "./abis/SimpleAccount"
import { SimpleAccountFactoryAbi } from "./abis/SimpleAccountFactory"
import type { Address } from "abitype"
import dotenv from "dotenv"
import { bundlerActions } from "permissionless"
import { UserOperation } from "permissionless/actions/types"
import {
    Account,
    Chain,
    Hex,
    ParseAccount,
    Transport,
    WalletClient,
    concatHex,
    createClient,
    createPublicClient,
    createWalletClient,
    encodeAbiParameters,
    encodeFunctionData,
    getContract,
    http,
    keccak256,
    zeroAddress
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { goerli } from "viem/chains"

// Load environment variables from .env file
dotenv.config()

if (!process.env.PIMLICO_API_KEY) throw new Error("PIMLICO_API_KEY environment variable not set")
if (!process.env.ENTRYPOINT_ADDRESS) throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
if (!process.env.TEST_PRIVATE_KEY) throw new Error("TEST_PRIVATE_KEY environment variable not set")
if (!process.env.RPC_URL) throw new Error("RPC_URL environment variable not set")

const pimlicoApiKey = process.env.PIMLICO_API_KEY
const entryPoint: Address = process.env.ENTRYPOINT_ADDRESS as Address

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

const getAccountInitCode = async (
    factoryAddress: Address,
    owner: WalletClient<Transport, Chain, ParseAccount<Account>>,
    index = 0n
): Promise<Hex> => {
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

const getInitCode = async (factoryAddress: Address, owner: WalletClient<Transport, Chain, ParseAccount<Account>>) => {
    const accountAddress = await getAccountAddress(factoryAddress, owner)
    if (!accountAddress) throw new Error("Account address not found")

    if (await isAccountDeployed(accountAddress)) return "0x"

    return getAccountInitCode(factoryAddress, owner)
}

const getAccountAddress = async (
    factoryAddress: Address,
    owner: WalletClient<Transport, Chain, ParseAccount<Account>>
): Promise<Address | null> => {
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

const main = async () => {
    const chain = "goerli"
    const account = privateKeyToAccount(process.env.TEST_PRIVATE_KEY as Address)
    const factoryAddress = "0x9406Cc6185a346906296840746125a0E44976454"

    const eoaWalletClient = createWalletClient({
        account,
        chain: goerli,
        transport: http(process.env.RPC_URL as string)
    })

    const accountAddress = await getAccountAddress(factoryAddress, eoaWalletClient)

    if (!accountAddress) throw new Error("Account address not found")

    const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas()

    const userOperation = {
        sender: accountAddress,
        nonce: await getNonce(accountAddress),
        initCode: await getInitCode(factoryAddress, eoaWalletClient),
        callData: await encodeExecute(zeroAddress as Hex, 0n, "0x" as Hex),
        maxFeePerGas: maxFeePerGas || 0n,
        maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
        paymasterAndData: "0x" as Hex,
        callGasLimit: 0n,
        verificationGasLimit: 0n,
        preVerificationGas: 0n,
        signature: getDummySignature()
    }

    const bundlerClient = createClient({
        chain: goerli,
        transport: http(`https://api.pimlico.io/v1/${chain}/rpc?apikey=${pimlicoApiKey}`)
    }).extend(bundlerActions)

    const supportedEntryPoints = await bundlerClient.supportedEntryPoints()

    if (!supportedEntryPoints.includes(entryPoint)) throw new Error("Entry point not supported")

    const chainId = await bundlerClient.chainId()

    if (chainId !== BigInt(goerli.id)) throw new Error("Chain ID not supported")

    const gasParaneters = await bundlerClient.estimateUserOperationGas({
        userOperation,
        entryPoint: entryPoint as Address
    })

    userOperation.callGasLimit = gasParaneters.callGasLimit
    userOperation.verificationGasLimit = gasParaneters.verificationGasLimit
    userOperation.preVerificationGas = gasParaneters.preVerificationGas

    const signedUserOperation: UserOperation = {
        ...userOperation,
        signature: await eoaWalletClient.signMessage({
            message: { raw: getUserOperationHash(userOperation, entryPoint, BigInt(goerli.id)) }
        })
    }

    // const userOpHash = await bundlerClient.sendUserOperation({
    //     userOperation: signedUserOperation,
    //     entryPoint: entryPoint as Address
    // })

    // console.log("userOpHash", userOpHash)

    const userOpHash = "0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34"

    const userOperationFromUserOpHash = await bundlerClient.getUserOperationByHash(userOpHash)

    console.log("userOperationFromUserOpHash", userOperationFromUserOpHash)

    const userOperationReceiptFromUserOpHash = await bundlerClient.getUserOperationReceipt(userOpHash)

    console.log("userOperationReceiptFromUserOpHash", userOperationReceiptFromUserOpHash)
}

main()

// bundlerClient.sendUserOperation({
//     userOperation,
//     entryPoint
// })
