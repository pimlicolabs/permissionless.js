import type { Address } from "abitype"
import type { Client, Hash } from "viem"
import { chainId } from "../../actions/bundler/chainId.js"
import {
    type EstimateUserOperationGasParameters,
    type EstimateUserOperationGasReturnType,
    estimateUserOperationGas
} from "../../actions/bundler/estimateUserOperationGas.js"
import {
    type GetUserOperationByHashParameters,
    type GetUserOperationByHashReturnType,
    getUserOperationByHash
} from "../../actions/bundler/getUserOperationByHash.js"
import {
    type GetUserOperationReceiptParameters,
    type GetUserOperationReceiptReturnType,
    getUserOperationReceipt
} from "../../actions/bundler/getUserOperationReceipt.js"
import { type SendUserOperationParameters, sendUserOperation } from "../../actions/bundler/sendUserOperation.js"
import { supportedEntryPoints } from "../../actions/bundler/supportedEntryPoints.js"
import {
    type WaitForUserOperationReceiptParameters,
    waitForUserOperationReceipt
} from "../../actions/bundler/waitForUserOperationReceipt.js"
import type { BundlerClient } from "../bundler.js"

export type BundlerActions = {
    /**
     *
     * Sends user operation to the bundler
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/sendUserOperation
     *
     * @param args {@link SendUserOperationParameters}.
     * @returns UserOpHash that you can use to track user operation as {@link Hash}.
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http("https://api.pimlico.io/v1/goerli/rpc?apikey=YOUR_API_KEY_HERE")
     * }).extend(bundlerActions)
     *
     * const userOpHash = await bundlerClient.sendUserOperation({
     *      userOperation: signedUserOperation,
     *      entryPoint: entryPoint
     * })
     *
     * // Return '0xe9fad2cd67f9ca1d0b7a6513b2a42066784c8df938518da2b51bb8cc9a89ea34'
     */
    sendUserOperation: (args: SendUserOperationParameters) => Promise<Hash>
    /**
     *
     * Estimates preVerificationGas, verificationGasLimit and callGasLimit for user operation
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/estimateUserOperationGas
     *
     * @param args {@link EstimateUserOperationGasParameters}
     * @returns preVerificationGas, verificationGasLimit and callGasLimit as {@link EstimateUserOperationGasReturnType}
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(bundlerActions)
     *
     * const gasParameters = await bundlerClient.estimateUserOperationGas({
     *     userOperation: signedUserOperation,
     *    entryPoint: entryPoint
     * })
     *
     * // Return {preVerificationGas: 43492n, verificationGasLimit: 59436n, callGasLimit: 9000n}
     */
    estimateUserOperationGas: (args: EstimateUserOperationGasParameters) => Promise<EstimateUserOperationGasReturnType>
    /**
     *
     * Returns the supported entrypoints by the bundler service
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/supportedEntryPoints
     *
     * @returns Supported entryPoints
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(bundlerActions)
     *
     * const supportedEntryPoints = await bundlerClient.supportedEntryPoints()
     *
     * // Return ['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']
     */
    supportedEntryPoints: () => Promise<Address[]>
    /**
     *
     * Returns the supported chain id by the bundler service
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/chainId
     *
     * @returns Supported chain id
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(bundlerActions)
     *
     * const chainId = await bundlerClient.chainId()
     * // Return 5n for Goerli
     */
    chainId: () => Promise<number>
    /**
     *
     * Returns the user operation from userOpHash
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/getUserOperationByHash
     *
     * @param args {@link GetUserOperationByHash} UserOpHash that was returned by {@link sendUserOperation}
     * @returns userOperation along with entryPoint, transactionHash, blockHash, blockNumber if found or null
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(bundlerActions)
     *
     * await bundlerClient.getUserOperationByHash(userOpHash)
     *
     */
    getUserOperationByHash: (args: GetUserOperationByHashParameters) => Promise<GetUserOperationByHashReturnType>
    /**
     *
     * Returns the user operation receipt from userOpHash
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/getUserOperationReceipt
     *
     * @param args {@link GetUserOperationReceiptParameters} UserOpHash that was returned by {@link sendUserOperation}
     * @returns user operation receipt {@link GetUserOperationReceiptReturnType} if found or null
     *
     * @example
     * import { createClient } from "viem"
     * import { bundlerActions } from "permissionless"
     *
     * const bundlerClient = createClient({
     *      chain: goerli,
     *      transport: http(BUNDLER_URL)
     * }).extend(bundlerActions)
     *
     * await bundlerClient.getUserOperationReceipt({hash: userOpHash})
     *
     */
    getUserOperationReceipt: (args: GetUserOperationReceiptParameters) => Promise<GetUserOperationReceiptReturnType>

    /**
     * Waits for the User Operation to be included on a [Block](https://viem.sh/docs/glossary/terms.html#block) (one confirmation), and then returns the [User Operation Receipt](https://docs.pimlico.io/permissionless/reference/bundler-actions/getUserOperationReceipt).
     *
     * - Docs: https://docs.pimlico.io/permissionless/reference/bundler-actions/waitForUserOperationReceipt
     *
     * @param client - Bundler Client to use
     * @param parameters - {@link WaitForUserOperationReceiptParameters}
     * @returns The transaction receipt. {@link GetUserOperationReceiptReturnType}
     *
     * @example
     * import { createBundlerClient, waitForUserOperationReceipt, http } from 'viem'
     * import { mainnet } from 'viem/chains'
     *
     * const bundlerClient = createBundlerClient({
     *   chain: mainnet,
     *   transport: http(),
     * })
     * const userOperationReceipt = await bundlerClient.waitForUserOperationReceipt({
     *   hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
     * })
     */
    waitForUserOperationReceipt: (
        args: WaitForUserOperationReceiptParameters
    ) => Promise<GetUserOperationReceiptReturnType>
}

const bundlerActions = (client: Client): BundlerActions => ({
    sendUserOperation: async (args: SendUserOperationParameters): Promise<Hash> =>
        sendUserOperation(client as BundlerClient, args),
    estimateUserOperationGas: (args: EstimateUserOperationGasParameters) =>
        estimateUserOperationGas(client as BundlerClient, args),
    supportedEntryPoints: (): Promise<Address[]> => supportedEntryPoints(client as BundlerClient),
    chainId: () => chainId(client as BundlerClient),
    getUserOperationByHash: (args: GetUserOperationByHashParameters) =>
        getUserOperationByHash(client as BundlerClient, args),
    getUserOperationReceipt: (args: GetUserOperationReceiptParameters) =>
        getUserOperationReceipt(client as BundlerClient, args),
    waitForUserOperationReceipt: (args: WaitForUserOperationReceiptParameters) =>
        waitForUserOperationReceipt(client as BundlerClient, args)
})

export { bundlerActions }
