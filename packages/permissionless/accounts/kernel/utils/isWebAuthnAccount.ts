import type { LocalAccount } from "viem"
import type { WebAuthnAccount } from "viem/account-abstraction"

export const isWebAuthnAccount = (
    owner: WebAuthnAccount | LocalAccount
): owner is WebAuthnAccount => {
    return owner.type === "webAuthn"
}
