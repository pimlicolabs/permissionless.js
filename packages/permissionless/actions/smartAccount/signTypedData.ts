import type { Chain } from "viem"
import type { BundlerClient, SmartAccount } from "viem/erc4337"
import { type Hex, TypedData } from "viem/utils"
import { AccountNotFoundError } from "../../errors/index.js"
import type { GetSmartAccountParameter } from "../../types/utils.js"

export type SignTypedDataParameters<
    typedData extends
        | TypedData.TypedData
        | Record<string, unknown> = TypedData.TypedData,
    primaryType extends keyof typedData | "EIP712Domain" = keyof typedData,
    account extends SmartAccount.SmartAccount | undefined =
        | SmartAccount.SmartAccount
        | undefined
> = TypedData.Definition<typedData, primaryType> &
    GetSmartAccountParameter<account>

/**
 * Signs typed data and calculates an Ethereum-specific signature in [https://eips.ethereum.org/EIPS/eip-712](https://eips.ethereum.org/EIPS/eip-712): `sign(keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message)))`
 *
 * - Docs: https://viem.sh/docs/actions/wallet/signTypedData.html
 * - JSON-RPC Methods:
 *   - JSON-RPC Accounts: [`eth_signTypedData_v4`](https://docs.metamask.io/guide/signing-data.html#signtypeddata-v4)
 *   - Local Accounts: Signs locally. No JSON-RPC request.
 *
 * @param client - Client to use
 * @param parameters - {@link SignTypedDataParameters}
 * @returns The signed data. {@link SignTypedDataReturnType}
 *
 * @example
 * import { createWalletClient, custom } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { signTypedData } from 'viem/wallet'
 *
 * const client = createWalletClient({
 *   chain: mainnet,
 *   transport: custom(window.ethereum),
 * })
 * const signature = await signTypedData(client, {
 *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 *   domain: {
 *     name: 'Ether Mail',
 *     version: '1',
 *     chainId: 1,
 *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 *   },
 *   types: {
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' },
 *     ],
 *     Mail: [
 *       { name: 'from', type: 'Person' },
 *       { name: 'to', type: 'Person' },
 *       { name: 'contents', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Mail',
 *   message: {
 *     from: {
 *       name: 'Cow',
 *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
 *     },
 *     to: {
 *       name: 'Bob',
 *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
 *     },
 *     contents: 'Hello, Bob!',
 *   },
 * })
 *
 * @example
 * // Account Hoisting
 * import { createWalletClient, http } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { mainnet } from 'viem/chains'
 * import { signTypedData } from 'viem/wallet'
 *
 * const client = createWalletClient({
 *   account: privateKeyToAccount('0x…'),
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const signature = await signTypedData(client, {
 *   domain: {
 *     name: 'Ether Mail',
 *     version: '1',
 *     chainId: 1,
 *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 *   },
 *   types: {
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' },
 *     ],
 *     Mail: [
 *       { name: 'from', type: 'Person' },
 *       { name: 'to', type: 'Person' },
 *       { name: 'contents', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Mail',
 *   message: {
 *     from: {
 *       name: 'Cow',
 *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
 *     },
 *     to: {
 *       name: 'Bob',
 *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
 *     },
 *     contents: 'Hello, Bob!',
 *   },
 * })
 */
export async function signTypedData<
    const TTypedData extends TypedData.TypedData | Record<string, unknown>,
    TPrimaryType extends keyof TTypedData | "EIP712Domain",
    TAccount extends SmartAccount.SmartAccount | undefined =
        | SmartAccount.SmartAccount
        | undefined
>(
    client: BundlerClient.Client<Chain.Chain | undefined, TAccount>,
    parameters: SignTypedDataParameters<TTypedData, TPrimaryType, TAccount>
): Promise<Hex.Hex> {
    const {
        account: account_ = client.account,
        domain,
        message,
        primaryType,
        types: types_
    } = parameters as SignTypedDataParameters
    if (!account_) {
        throw new AccountNotFoundError({
            docsPath: "/docs/actions/wallet/signMessage"
        })
    }

    const account = account_ as SmartAccount.SmartAccount

    const types = {
        EIP712Domain: TypedData.extractEip712DomainTypes(domain),
        ...types_
    } as unknown as Record<string, readonly TypedData.Parameter[]>

    const typedData = {
        domain,
        message,
        primaryType,
        types
    } as unknown as TypedData.Definition

    TypedData.assert(typedData)

    return account.signTypedData(typedData)
}
