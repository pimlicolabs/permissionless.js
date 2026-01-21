import type { LocalAccount } from "viem"
import type { WebAuthnAccount } from "viem/account-abstraction"

export const isWebAuthnAccount: (
    owner: WebAuthnAccount | LocalAccount
) => owner is WebAuthnAccount = (owner) => {
    return owner.type === "webAuthn"
}
