import {
    type Chain,
    type Client,
    type SignTypedDataParameters,
    type SignTypedDataReturnType,
    type Transport,
    type TypedData,
    type TypedDataDefinition,
    getTypesForEIP712Domain,
    validateTypedData
} from "viem"
import { type SmartAccount } from "../../accounts/types.js"
import { AccountOrClientNotFoundError, parseAccount } from "../../utils/index.js"

export async function signTypedData<
    const TTypedData extends TypedData | { [key: string]: unknown },
    TPrimaryType extends string,
    TChain extends Chain | undefined,
    TAccount extends SmartAccount | undefined
>(
    client: Client<Transport, TChain, TAccount>,
    {
        account: account_ = client.account,
        domain,
        message,
        primaryType,
        types: types_
    }: SignTypedDataParameters<TTypedData, TPrimaryType, TAccount>
): Promise<SignTypedDataReturnType> {
    if (!account_) {
        throw new AccountOrClientNotFoundError({
            docsPath: "/docs/actions/wallet/signMessage"
        })
    }

    const account = parseAccount(account_)

    const types = {
        EIP712Domain: getTypesForEIP712Domain({ domain }),
        ...(types_ as TTypedData)
    }

    validateTypedData({
        domain,
        message,
        primaryType,
        types
    } as TypedDataDefinition)

    if (account.type === "local") {
        return account.signTypedData({
            domain,
            primaryType,
            types,
            message
        } as TypedDataDefinition)
    }

    throw new Error("Sign type message is not supported by this account")
}
