import { UserOperation, getAccountNonce, getSenderAddress } from "permissionless"
import { Address, Hex, WalletClient, concatHex, encodeFunctionData, zeroAddress } from "viem"
import { PartialBy } from "viem/types/utils"
import { SimpleAccountAbi } from "./abis/SimpleAccount"
import { SimpleAccountFactoryAbi } from "./abis/SimpleAccountFactory"
import { getDummySignature, getEntryPoint, getFactoryAddress, getPublicClient, isAccountDeployed } from "./utils"

const getInitCode = async (factoryAddress: Address, owner: WalletClient) => {
    const accountAddress = await getAccountAddress(factoryAddress, owner)
    if (!accountAddress) throw new Error("Account address not found")

    if (await isAccountDeployed(accountAddress)) return "0x"

    return getAccountInitCode(factoryAddress, owner)
}

export const getAccountInitCode = async (factoryAddress: Address, owner: WalletClient, index = 0n): Promise<Hex> => {
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

const getAccountAddress = async (factoryAddress: Address, owner: WalletClient): Promise<Address | null> => {
    const initCode = await getAccountInitCode(factoryAddress, owner)
    const publicClient = await getPublicClient()
    const entryPoint = getEntryPoint()

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

export const buildUserOp = async (eoaWalletClient: WalletClient) => {
    await new Promise((resolve) => {
        setTimeout(() => {
            // wait for prev user op to be added to make sure ew get correct nonce
            resolve(0)
        }, 1000)
    })

    const factoryAddress = getFactoryAddress()
    const publicClient = await getPublicClient()
    const entryPoint = getEntryPoint()

    const accountAddress = await getAccountAddress(factoryAddress, eoaWalletClient)

    if (!accountAddress) throw new Error("Account address not found")

    const nonce = await getAccountNonce(publicClient, {
        sender: accountAddress,
        entryPoint: entryPoint
    })

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
