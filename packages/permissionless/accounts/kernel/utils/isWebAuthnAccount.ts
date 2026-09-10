import type { WebAuthnAccount } from "viem/erc4337"

export const isWebAuthnAccount = (owner: {
    type?: string | undefined
}): owner is WebAuthnAccount.Account => owner.type === "webAuthn"
