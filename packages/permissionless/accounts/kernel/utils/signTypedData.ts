import {
    type Account,
    type Chain,
    type Client,
    type LocalAccount,
    type SignTypedDataParameters,
    type SignTypedDataReturnType,
    type Transport,
    type TypedData,
    getTypesForEIP712Domain,
    hashTypedData,
    publicActions,
    validateTypedData
} from "viem"

import {
    signMessage as _signMessage,
    signTypedData as _signTypedData
} from "viem/actions"
import { type WrapMessageHashParams, wrapMessageHash } from "./wrapMessageHash"

export async function signTypedData<
    const typedData extends TypedData | Record<string, unknown>,
    primaryType extends keyof typedData | "EIP712Domain",
    chain extends Chain | undefined,
    account extends Account | undefined
>(
    client: Client<Transport, chain, account>,
    parameters: SignTypedDataParameters<typedData, primaryType, account> &
        WrapMessageHashParams
): Promise<SignTypedDataReturnType> {
    const {
        account: account_,
        accountAddress,
        accountVersion,
        ...typedData
    } = parameters as unknown as SignTypedDataParameters & WrapMessageHashParams
    if (accountVersion === "0.2.2") {
        return _signTypedData(client, { account: account_, ...typedData })
    }
    const { message, primaryType, types: _types, domain } = typedData
    const types = {
        EIP712Domain: getTypesForEIP712Domain({
            domain: domain
        }),
        ..._types
    }

    // Need to do a runtime validation check on addresses, byte ranges, integer ranges, etc
    // as we can't statically check this with TypeScript.
    validateTypedData({
        domain,
        message,
        primaryType,
        types
    })

    const typedHash = hashTypedData({ message, primaryType, types, domain })

    const wrappedMessageHash = wrapMessageHash(typedHash, {
        accountVersion,
        accountAddress,
        chainId: client.chain
            ? client.chain.id
            : await client.extend(publicActions).getChainId()
    })

    const signature = await _signMessage(client, {
        account: account_ as LocalAccount,
        message: { raw: wrappedMessageHash }
    })

    return signature
}
