import { BundlerClient, UserOperation, getUserOperationHash } from "permissionless"
import { StackupPaymasterClient } from "permissionless/clients/stackup"
import { Address } from "viem"
import { fetchUserOperationReceipt } from "./bundlerActions.test"
import { buildUserOp } from "./userOp"
import { getEntryPoint, getEoaWalletClient, getPublicClient, getTestingChain } from "./utils"

export const testStackupBundlerActions = async (
    stackupBundlerClient: StackupPaymasterClient,
    bundlerClient: BundlerClient
) => {
    const entryPoint = getEntryPoint()
    const chain = getTestingChain()

    console.log("STACKUP ACTIONS:: ======= TESTING STACKUP PAYMASTER ACTIONS =======")
    const supportedPaymasters = await stackupBundlerClient.accounts({ entryPoint })
    console.log("PAYMASTER ADDRESSES: ", supportedPaymasters)

    const eoaWalletClient = getEoaWalletClient()
    const publicClient = await getPublicClient()

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

    console.log(userOperation, "STACKUP ACTIONS:: ============= USER OPERATION =============")

    const userOperationHash = getUserOperationHash({ userOperation, entryPoint, chainId: chain.id })

    console.log(userOperationHash, "STACKUP ACTIONS:: ============= USER OPERATION HASH =============")

    const signedUserOperation: UserOperation = {
        ...userOperation,
        signature: await eoaWalletClient.signMessage({
            account: eoaWalletClient.account,
            message: { raw: userOperationHash }
        })
    }
    console.log(signedUserOperation, "STACKUP ACTIONS:: ============= SIGNED USER OPERATION HASH =============")

    const userOpHash = await bundlerClient.sendUserOperation({
        userOperation: signedUserOperation,
        entryPoint: entryPoint as Address
    })

    console.log("userOpHash", userOpHash)
    await fetchUserOperationReceipt(bundlerClient, userOpHash)
}
