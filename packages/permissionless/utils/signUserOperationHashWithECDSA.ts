import {
    type Account,
    BaseError,
    type Chain,
    type Client,
    type Hash,
    type Hex,
    type Transport
} from "viem"
import type {
    EntryPoint,
    GetAccountParameterWithClient,
    GetEntryPointVersion
} from "../types/"
import type { UserOperation } from "../types/userOperation"
import { parseAccount } from "./"
import { getUserOperationHash } from "./getUserOperationHash"

export type SignUserOperationHashWithECDSAParams<
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
> = GetAccountParameterWithClient<TTransport, TChain, TAccount> &
    (
        | {
              hash: Hash
              userOperation?: undefined
              entryPoint?: undefined
              chainId?: undefined
          }
        | {
              hash?: undefined
              userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
              entryPoint: entryPoint
              chainId: number
          }
    )

export class AccountOrClientNotFoundError extends BaseError {
    override name = "AccountOrClientNotFoundError"
    constructor({ docsPath }: { docsPath?: string } = {}) {
        super(
            [
                "Could not find an Account to execute with this Action.",
                "Please provide an Account with the `account` argument on the Action, or by supplying an `account` to the WalletClient."
            ].join("\n"),
            {
                docsPath,
                docsSlug: "account"
            }
        )
    }
}

/**
 *
 * Returns signature for user operation. It signs over user operation hash.
 * If you have a custom way of signing user operation hash, you can use this function to sign it with ECDSA.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/utils/signUserOperationHashWithECDSA
 *
 * @param signer: owner as {@link Client<Transport, TChain, TAccount>}
 * @param params: account & (userOperation, entryPoint, chainId)  | hash to sign
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
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined
>({
    client,
    account: account_ = client?.account,
    hash,
    userOperation,
    chainId,
    entryPoint: entryPointAddress
}: SignUserOperationHashWithECDSAParams<
    entryPoint,
    TTransport,
    TChain,
    TAccount
>): Promise<Hex> => {
    if (!account_)
        throw new AccountOrClientNotFoundError({
            docsPath:
                "/permissionless/reference/utils/signUserOperationHashWithECDSA"
        })

    let userOperationHash: Hash

    if (hash) {
        userOperationHash = hash
    } else {
        userOperationHash = getUserOperationHash<entryPoint>({
            userOperation,
            chainId,
            entryPoint: entryPointAddress
        })
    }

    const account = parseAccount(account_)

    if (account.type === "local")
        return account.signMessage({
            message: {
                raw: userOperationHash
            }
        })

    if (!client)
        throw new AccountOrClientNotFoundError({
            docsPath:
                "/permissionless/reference/utils/signUserOperationHashWithECDSA"
        })

    return client.request({
        method: "personal_sign",
        params: [userOperationHash, account.address]
    })
}
