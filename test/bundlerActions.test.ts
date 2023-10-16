import { BundlerClient, UserOperation } from "permissionless"
import { getUserOperationHash } from "permissionless/utils"
import { Address, Hex } from "viem"
import { buildUserOp } from "./userOp"
import { getEntryPoint, getEoaWalletClient, getPublicClient, getTestingChain } from "./utils"

export const fetchUserOperationReceipt = async (bundlerClient: BundlerClient, userOpHash: Hex) => {
    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            console.log("fetching user operation receipt")
            const userOperationReceipt = await bundlerClient.getUserOperationReceipt({ hash: userOpHash })

            if (userOperationReceipt) {
                clearInterval(interval)
                resolve(userOperationReceipt)
                console.log("userOperationReceipt", userOperationReceipt)
            }
        }, 1000)
    })
}

const testSupportedEntryPoints = async (bundlerClient: BundlerClient) => {
    const supportedEntryPoints = await bundlerClient.supportedEntryPoints()

    if (!supportedEntryPoints.includes(getEntryPoint())) throw new Error("Entry point not supported")
}

const testChainId = async (bundlerClient: BundlerClient) => {
    const chainId = await bundlerClient.chainId()
    const chain = getTestingChain()

    if (chainId !== chain.id) throw new Error("Chain ID not supported")
}

export const testBundlerActions = async (bundlerClient: BundlerClient) => {
    console.log("BUNDLER ACTIONS:: ======= TESTING BUNDLER ACTIONS =======")

    const eoaWalletClient = getEoaWalletClient()
    const entryPoint = getEntryPoint()
    const chain = getTestingChain()
    const publicClient = await getPublicClient()

    console.log("BUNDLER ACTIONS:: ======= TESTING SUPPORTED ENTRY POINTS =======")
    await testSupportedEntryPoints(bundlerClient)

    console.log("BUNDLER ACTIONS:: ======= TESTING CHAIN ID =======")
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

    console.log("BUNDLER ACTIONS:: ======= TESTING ESTIMATE USER OPERATION GAS =======")
    const gasParameters = await bundlerClient.estimateUserOperationGas({
        userOperation,
        entryPoint: entryPoint as Address
    })

    userOperation.callGasLimit = gasParameters.callGasLimit
    userOperation.verificationGasLimit = gasParameters.verificationGasLimit
    userOperation.preVerificationGas = gasParameters.preVerificationGas

    console.log("BUNDLER ACTIONS:: ======= TESTING SEND USER OPERATION =======")
    const signedUserOperation: UserOperation = {
        ...userOperation,
        signature: await eoaWalletClient.signMessage({
            account: eoaWalletClient.account,
            message: { raw: getUserOperationHash({ userOperation, entryPoint, chainId: chain.id }) }
        })
    }

    const userOpHash = await bundlerClient.sendUserOperation({
        userOperation: signedUserOperation,
        entryPoint: entryPoint as Address
    })

    console.log(userOpHash, "BUNDLER ACTIONS:: ======= USER OPERATION HASH =======")

    await fetchUserOperationReceipt(bundlerClient, userOpHash)

    const userOpHashOld = "0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34"

    const userOperationFromUserOpHash = await bundlerClient.getUserOperationByHash({ hash: userOpHashOld })

    console.log("userOperationFromUserOpHash", userOperationFromUserOpHash)

    const userOperationReceiptFromUserOpHash = await bundlerClient.getUserOperationReceipt({ hash: userOpHashOld })

    console.log("userOperationReceiptFromUserOpHash", userOperationReceiptFromUserOpHash)
}
