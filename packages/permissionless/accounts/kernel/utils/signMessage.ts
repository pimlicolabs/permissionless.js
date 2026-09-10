import type { Account } from "viem"
import type { WebAuthnAccount } from "viem/erc4337"
import { type Address, Hex, PersonalMessage } from "viem/utils"
import type { Version } from "../version.js"
import { signHash } from "./signHash.js"

export type SignMessageParameters = {
    message: Account.SignableMessage
    owner: Account.Local | WebAuthnAccount.Account
    address: Address.Address
    version: Version
    chainId: number
    eip7702?: boolean | undefined
}

export const hashMessage = (message: Account.SignableMessage) =>
    PersonalMessage.getSignPayload(
        typeof message === "string" ? Hex.fromString(message) : message.raw
    )

export async function signMessage({
    message,
    owner,
    address,
    version,
    chainId,
    eip7702 = false
}: SignMessageParameters): Promise<Hex.Hex> {
    if ((version === "0.2.1" || version === "0.2.2") && owner.type === "local")
        return owner.signMessage({ message })
    return signHash({
        hash: hashMessage(message),
        owner,
        address,
        version,
        chainId,
        eip7702
    })
}
