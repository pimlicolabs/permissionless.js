import { Errors } from "viem"
import type { EntryPoint } from "viem/erc4337"

export class SimpleAccountErc1271UnsupportedError extends Errors.BaseError {
    override name = "SimpleAccountErc1271UnsupportedError"

    constructor() {
        super("Simple account isn't 1271 compliant")
    }
}

export class SimpleAccountFactoryAddressRequiredError extends Errors.BaseError {
    override name = "SimpleAccountFactoryAddressRequiredError"

    constructor({
        entryPointVersion
    }: {
        entryPointVersion: EntryPoint.Version
    }) {
        super(
            `No default SimpleAccountFactory is known for EntryPoint ${entryPointVersion}.`,
            { metaMessages: ["Pass `factoryAddress` explicitly."] }
        )
    }
}
