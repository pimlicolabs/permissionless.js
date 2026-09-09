import { Errors } from "viem"

export class SafeEntryPointVersionUnsupportedError extends Errors.BaseError {
    override name = "SafeEntryPointVersionUnsupportedError"

    constructor({
        version,
        entryPointVersion
    }: {
        version: string
        entryPointVersion: string
    }) {
        super(
            `Safe version ${version} does not support EntryPoint version ${entryPointVersion}.`
        )
    }
}

export class SafeWebAuthnSharedSignerAddressMissingError extends Errors.BaseError {
    override name = "SafeWebAuthnSharedSignerAddressMissingError"

    constructor() {
        super(
            "A WebAuthn owner requires `safeWebAuthnSharedSignerAddress`, and no default exists for this Safe version and EntryPoint version."
        )
    }
}

export class SafeInvalidOwnerError extends Errors.BaseError {
    override name = "SafeInvalidOwnerError"

    constructor() {
        super(
            "Owner must be an account, a wallet client, an EIP-1193 provider or a WebAuthn account."
        )
    }
}

export class SafeInsufficientOwnersError extends Errors.BaseError {
    override name = "SafeInsufficientOwnersError"

    constructor({
        owners,
        threshold,
        metaMessages
    }: {
        owners: number
        threshold: bigint
        metaMessages?: readonly string[] | undefined
    }) {
        super(
            `Safe requires ${threshold} owner signature(s) but only ${owners} owner(s) can sign locally.`,
            { metaMessages }
        )
    }
}

export class SafeErc7579VersionUnsupportedError extends Errors.BaseError {
    override name = "SafeErc7579VersionUnsupportedError"

    constructor({ version }: { version: string }) {
        super(
            `ERC-7579 Safe accounts on Safe ${version} cannot sign messages or typed data.`
        )
    }
}

export class SafeSenderRequiredError extends Errors.BaseError {
    override name = "SafeSenderRequiredError"

    constructor() {
        super("`sender` is required to sign a Safe user operation.")
    }
}

export class SafeInvalidWebAuthnClientDataError extends Errors.BaseError {
    override name = "SafeInvalidWebAuthnClientDataError"

    constructor() {
        super("Challenge not found in the WebAuthn client data JSON.")
    }
}

export class SafeInvalidSignatureError extends Errors.BaseError {
    override name = "SafeInvalidSignatureError"

    constructor({ v }: { v: number }) {
        super(`Invalid signature: unexpected \`v\` value ${v}.`)
    }
}
