import type {
    Abi,
    Chain,
    Client,
    DeployContractParameters,
    EncodeDeployDataParameters,
    Hash,
    Transport
} from "viem"
import type { SmartAccount } from "../../accounts/types"
import type { Prettify } from "../../types/"
import { getAction } from "../../utils/getAction"
import { parseAccount } from "../../utils/"
import { AccountOrClientNotFoundError } from "../../utils/signUserOperationHashWithECDSA"
import { waitForUserOperationReceipt } from "../bundler/waitForUserOperationReceipt"
import { type SponsorUserOperationMiddleware } from "./prepareUserOperationRequest"
import { sendUserOperation } from "./sendUserOperation"

export type DeployContractParametersWithPaymaster<
    TAbi extends Abi | readonly unknown[] = Abi | readonly unknown[],
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends SmartAccount | undefined = SmartAccount | undefined,
    TChainOverride extends Chain | undefined = Chain | undefined
> = DeployContractParameters<TAbi, TChain, TAccount, TChainOverride> &
    SponsorUserOperationMiddleware

/**
 * Deploys a contract to the network, given bytecode and constructor arguments.
 * This function also allows you to sponsor this transaction if sender is a smartAccount
 *
 * - Docs: https://viem.sh/docs/contract/deployContract.html
 * - Examples: https://stackblitz.com/github/wagmi-dev/viem/tree/main/examples/contracts/deploying-contracts
 *
 * @param client - Client to use
 * @param parameters - {@link DeployContractParameters}
 * @returns The [Transaction](https://viem.sh/docs/glossary/terms.html#transaction) hash.
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
    TChain extends Chain | undefined,
    TAccount extends SmartAccount | undefined
>(
    client: Client<Transport, TChain, TAccount>,
    args: Prettify<DeployContractParametersWithPaymaster>
): Promise<Hash> {
    const {
        abi,
        args: constructorArgs,
        bytecode,
        sponsorUserOperation,
        ...request
    } = args

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
                bytecode,
                args: constructorArgs
            } as EncodeDeployDataParameters)
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
