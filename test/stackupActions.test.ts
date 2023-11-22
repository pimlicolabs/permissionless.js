import { UserOperation } from "permissionless"
import { StackupPaymasterClient } from "permissionless/clients/stackup"
import { getUserOperationHash } from "permissionless/utils"
import { Address } from "viem"
import { buildUserOp } from "./userOp.js"
import { getEntryPoint, getEoaWalletClient, getTestingChain } from "./utils.js"

export const testStackupBundlerActions = async (
    stackupBundlerClient: StackupPaymasterClient
) => {
    const entryPoint = getEntryPoint()
    const chain = getTestingChain()

    const supportedPaymasters = await stackupBundlerClient.accounts({
        entryPoint
    })

    const eoaWalletClient = getEoaWalletClient()
    const userOperation = await buildUserOp(eoaWalletClient)

    const sponsorUserOperationPaymasterAndData =
        await stackupBundlerClient.sponsorUserOperation({
            userOperation: userOperation,
            entryPoint: entryPoint as Address,
            context: {
                type: "payg"
            }
        })

    userOperation.paymasterAndData =
        sponsorUserOperationPaymasterAndData.paymasterAndData
    userOperation.callGasLimit =
        sponsorUserOperationPaymasterAndData.callGasLimit
    userOperation.verificationGasLimit =
        sponsorUserOperationPaymasterAndData.verificationGasLimit
    userOperation.preVerificationGas =
        sponsorUserOperationPaymasterAndData.preVerificationGas

    const userOperationHash = getUserOperationHash({
        userOperation,
        entryPoint,
        chainId: chain.id
    })

    const signedUserOperation: UserOperation = {
        ...userOperation,
        signature: await eoaWalletClient.signMessage({
            account: eoaWalletClient.account,
            message: { raw: userOperationHash }
        })
    }

    const userOpHash = await stackupBundlerClient.sendUserOperation({
        userOperation: signedUserOperation,
        entryPoint: entryPoint as Address
    })

    await stackupBundlerClient.waitForUserOperationReceipt({
        hash: userOpHash
    })
}
