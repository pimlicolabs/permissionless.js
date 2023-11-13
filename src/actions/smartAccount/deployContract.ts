import {
    type Abi,
    type Chain,
    type Client,
    type DeployContractParameters,
    type DeployContractReturnType,
    type Transport
} from "viem"
import type { SmartAccount } from "../../accounts/types.js"
import { getAction } from "../../utils/getAction.js"
import { parseAccount } from "../../utils/index.js"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA.js"
import { waitForUserOperationReceipt } from "../bundler/waitForUserOperationReceipt.js"
import { sendUserOperation } from "./sendUserOperation.js"
import { SponsorUserOperationMiddleware } from "./prepareUserOperationRequest.js"

/**
 * Deploys a contract to the network, given bytecode and constructor arguments.
 * This function also allows you to sponsor this transaction if sender is a smartAccount
 *
 * - Docs: https://viem.sh/docs/contract/deployContract.html
 * - Examples: https://stackblitz.com/github/wagmi-dev/viem/tree/main/examples/contracts/deploying-contracts
 *
 * @param client - Client to use
 * @param parameters - {@link DeployContractParameters}
 * @returns The [Transaction](https://viem.sh/docs/glossary/terms.html#transaction) hash. {@link DeployContractReturnType}
 *
 * @example
 * import { createWalletClient, http } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { mainnet } from 'viem/chains'
 * import { deployContract } from 'viem/contract'
 *
 * const client = createWalletClient({
 *   account: privateKeyToAccount('0x…'),
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const hash = await deployContract(client, {
 *   abi: [],
 *   account: '0x…,
 *   bytecode: '0x608060405260405161083e38038061083e833981016040819052610...',
 * })
 */
export async function deployContract<
    const TAbi extends Abi | readonly unknown[],
    TChain extends Chain | undefined,
    TAccount extends SmartAccount | undefined,
    TChainOverride extends Chain | undefined
>(
    client: Client<Transport, TChain, TAccount>,
    {
        abi,
        args,
        bytecode,
        sponsorUserOperation,
        ...request
    }: DeployContractParameters<TAbi, TChain, TAccount, TChainOverride> &
        SponsorUserOperationMiddleware
): Promise<DeployContractReturnType> {
    const { account: account_ = client.account } = request

    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const account = parseAccount(account_) as SmartAccount

    const userOpHash = await getAction(
        client,
        sendUserOperation
    )({
        userOperation: {
            sender: account.address,
            paymasterAndData: "0x",
            maxFeePerGas: request.maxFeePerGas || 0n,
            maxPriorityFeePerGas: request.maxPriorityFeePerGas || 0n,
            callData: await account.encodeDeployCallData({
                abi,
                args,
                bytecode
            } as unknown as DeployContractParameters<
                TAbi,
                TChain,
                TAccount,
                TChainOverride
            >)
        },
        account: account,
        sponsorUserOperation
    })

    const userOperationReceipt = await getAction(
        client,
        waitForUserOperationReceipt
    )({
        hash: userOpHash
    })

    return userOperationReceipt?.receipt.transactionHash
}
