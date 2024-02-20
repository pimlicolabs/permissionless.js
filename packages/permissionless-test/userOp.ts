import {
    UserOperation,
    getAccountNonce,
    getSenderAddress
} from "permissionless"
import {
    Address,
    Hex,
    WalletClient,
    concatHex,
    encodeFunctionData,
    zeroAddress
} from "viem"
import { PartialBy } from "viem/types/utils"
import { SimpleAccountAbi } from "./abis/SimpleAccount"
import { SimpleAccountFactoryAbi } from "./abis/SimpleAccountFactory"
import {
    getDummySignature,
    getEntryPoint,
    getFactoryAddress,
    getPublicClient,
    isAccountDeployed
} from "./utils"

const getInitCode = async (
    factoryAddress: Address,
    owner: WalletClient,
    index: bigint
) => {
    const accountAddress = await getAccountAddress(factoryAddress, owner, index)
    if (!accountAddress) throw new Error("Account address not found")

    if (await isAccountDeployed(accountAddress)) return "0x"

    return getAccountInitCode(factoryAddress, owner, index)
}

export const getAccountInitCode = async (
    factoryAddress: Address,
    owner: WalletClient,
    index: bigint
): Promise<Hex> => {
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

const getAccountAddress = async (
    factoryAddress: Address,
    owner: WalletClient,
    index: bigint
): Promise<Address | null> => {
    const initCode = await getAccountInitCode(factoryAddress, owner, index)
    const publicClient = await getPublicClient()
    const entryPoint = getEntryPoint()

    return getSenderAddress(publicClient, {
        initCode,
        entryPoint
    })
}

const encodeExecute = async (
    target: Hex,
    value: bigint,
    data: Hex
): Promise<`0x${string}`> => {
    return encodeFunctionData({
        abi: SimpleAccountAbi,
        functionName: "execute",
        args: [target, value, data]
    })
}

export const buildUserOp = async (
    eoaWalletClient: WalletClient,
    index = 0n
): Promise<UserOperation> => {
    await new Promise((resolve) => {
        setTimeout(() => {
            // wait for prev user op to be added to make sure we get correct nonce
            resolve(0)
        }, 1000)
    })

    const factoryAddress = getFactoryAddress()
    const publicClient = await getPublicClient()
    const entryPoint = getEntryPoint()

    const accountAddress = await getAccountAddress(
        factoryAddress,
        eoaWalletClient,
        index
    )

    if (!accountAddress) throw new Error("Account address not found")

    const nonce = await getAccountNonce(publicClient, {
        sender: accountAddress,
        entryPoint: entryPoint
    })

    const { maxFeePerGas, maxPriorityFeePerGas } =
        await publicClient.estimateFeesPerGas()

    const userOperation: UserOperation = {
        sender: accountAddress,
        nonce: nonce,
        initCode: await getInitCode(factoryAddress, eoaWalletClient, index),
        callData: await encodeExecute(zeroAddress as Hex, 0n, "0x" as Hex),
        paymasterAndData: "0x" as Hex,
        signature: getDummySignature(),
        maxFeePerGas: maxFeePerGas || 0n,
        maxPriorityFeePerGas: maxPriorityFeePerGas || 0n,
        callGasLimit: 0n,
        verificationGasLimit: 0n,
        preVerificationGas: 0n
    }

    return userOperation
}
