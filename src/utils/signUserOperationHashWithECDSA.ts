import type { Account, Chain, Hash, Hex, Transport, WalletClient } from "viem"
import { type GetUserOperationHashParams, getUserOperationHash } from "./getUserOperationHash.js"

/**
 *
 * Returns signature for user operation. It signs over user operation hash.
 * If you have a custom way of signing user operation hash, you can use this function to sign it with ECDSA.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/utils/signUserOperationHashWithECDSA
 *
 * @param args: userOperation, entryPoint, chainId as {@link GetUserOperationHashParams} | hash to sign
 * @returns signature as {@link Hash}
 *
 * @example
 * import { signUserOperationHashWithECDSA } from "permissionless/utils"
 *
 * const userOperationSignature = signUserOperationHashWithECDSA(owner, {
 *      userOperation,
 *      entryPoint,
 *      chainId
 * })
 *
 * // Returns "0x7d9ae17d5e617e4bf3221dfcb69d64d824959e5ae2ef7078c6ddc3a4fe26c8301ab39277c61160dca68ca90071eb449d9fb2fbbc78b3614d9d7282c860270e291c"
 *
 */
export const signUserOperationHashWithECDSA = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account = Account
>(
    owner: WalletClient<TTransport, TChain, TAccount>,
    params: GetUserOperationHashParams | Hash
): Promise<Hex> => {
    let userOperationHash: Hash

    if (typeof params === "string") {
        userOperationHash = params
    } else {
        const { userOperation, chainId, entryPoint } = params
        userOperationHash = getUserOperationHash({ userOperation, chainId, entryPoint })
    }

    return owner.signMessage({
        account: owner.account,
        message: {
            raw: userOperationHash
        }
    })
}
