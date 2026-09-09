import type { Account } from "viem"
import type { WebAuthnAccount } from "viem/erc4337"
import { type Address, type Hex, TypedData } from "viem/utils"
import type { Version } from "../version.js"
import { signMessage, toKernelTypedData } from "./signMessage.js"
import { wrapMessageHash } from "./wrapMessageHash.js"

export type SignTypedDataParameters = {
    typedData: TypedData.Definition
    owner: Account.Local | WebAuthnAccount.Account
    address: Address.Address
    version: Version
    chainId: number
    eip7702?: boolean | undefined
}

export async function signTypedData({
    typedData,
    owner,
    address,
    version,
    chainId,
    eip7702 = false
}: SignTypedDataParameters): Promise<Hex.Hex> {
    if ((version === "0.2.1" || version === "0.2.2") && owner.type === "local")
        return owner.signTypedData(typedData)
    const hash = TypedData.getSignPayload(typedData)
    if (eip7702 && owner.type === "local")
        return owner.signTypedData(
            toKernelTypedData({ hash, address, version, chainId })
        )
    const wrapped = wrapMessageHash({ hash, address, version, chainId })
    if (owner.type === "webAuthn")
        return signMessage({
            message: { raw: wrapped },
            owner,
            address,
            version,
            chainId
        })
    return owner.signMessage({ message: { raw: wrapped } })
}
