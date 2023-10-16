import { BundlerClient, UserOperation, getUserOperationHash } from "permissionless"
import { PimlicoBundlerClient, PimlicoPaymasterClient } from "permissionless/clients/pimlico"
import { http, Address, createWalletClient } from "viem"
import { fetchUserOperationReceipt } from "./bundlerActions.test"
import { buildUserOp } from "./userOp"
import {
    getEntryPoint,
    getEoaWalletClient,
    getOldUserOpHash,
    getPrivateKeyAccount,
    getPublicClient,
    getTestingChain
} from "./utils"

const getUserOperationGasPriceFromPimlicoBundler = async (pimlicoBundlerClient: PimlicoBundlerClient) => {
    return pimlicoBundlerClient.getUserOperationGasPrice()
}

const testFetchUserOperationStatus = async (pimlicoBundlerClient: PimlicoBundlerClient) => {
    const userOpHashOld = getOldUserOpHash()

    const userOperationStatus = await pimlicoBundlerClient.getUserOperationStatus({
        hash: userOpHashOld
    })

    console.log(userOperationStatus)
}

export const testPimlicoBundlerActions = async (pimlicoBundlerClient: PimlicoBundlerClient) => {
    console.log("PIMLICO ACTIONS:: ======= TESTING PIMLICO BUNDLER ACTIONS =======")

    console.log("PIMLICO ACTIONS:: ======= TESTING PIMLICO GET USER OPERATION GAS PRICE =======")

    await getUserOperationGasPriceFromPimlicoBundler(pimlicoBundlerClient)

    testFetchUserOperationStatus(pimlicoBundlerClient)
}

export const testPimlicoPaymasterActions = async (
    pimlicoPaymasterClient: PimlicoPaymasterClient,
    bundlerClient: BundlerClient
) => {
    console.log("PIMLICO ACTIONS:: ======= TESTING PIMLICO PAYMASTER ACTIONS =======")

    const entryPoint = getEntryPoint()
    const chain = getTestingChain()
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

    const sponsorUserOperationPaymasterAndData = await pimlicoPaymasterClient.sponsorUserOperation({
        userOperation: userOperation,
        entryPoint: entryPoint as Address
    })
    console.log("sponsorUserOperationPaymasterAndData", sponsorUserOperationPaymasterAndData)

    userOperation.paymasterAndData = sponsorUserOperationPaymasterAndData.paymasterAndData
    userOperation.callGasLimit = sponsorUserOperationPaymasterAndData.callGasLimit
    userOperation.verificationGasLimit = sponsorUserOperationPaymasterAndData.verificationGasLimit
    userOperation.preVerificationGas = sponsorUserOperationPaymasterAndData.preVerificationGas

    console.log(userOperation, "PIMLICO ACTIONS:: ============= USER OPERATION =============")

    const userOperationHash = getUserOperationHash({ userOperation, entryPoint, chainId: chain.id })

    console.log(userOperationHash, "PIMLICO ACTIONS:: ============= USER OPERATION HASH =============")

    const signedUserOperation: UserOperation = {
        ...userOperation,
        signature: await eoaWalletClient.signMessage({
            account: eoaWalletClient.account,
            message: { raw: userOperationHash }
        })
    }
    console.log(signedUserOperation, "PIMLICO ACTIONS:: ============= SIGNED USER OPERATION HASH =============")

    const userOpHash = await bundlerClient.sendUserOperation({
        userOperation: signedUserOperation,
        entryPoint: entryPoint as Address
    })

    console.log("userOpHash", userOpHash)
    await fetchUserOperationReceipt(bundlerClient, userOpHash)
}
