import type { Account } from "viem"
import type { WebAuthnAccount } from "viem/erc4337"
import { type Address, type Hex, TypedData } from "viem/utils"
import type { Version } from "../version.js"
import { signHash } from "./signHash.js"

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
    return signHash({
        hash: TypedData.getSignPayload(typedData),
        owner,
        address,
        version,
        chainId,
        eip7702
    })
}
