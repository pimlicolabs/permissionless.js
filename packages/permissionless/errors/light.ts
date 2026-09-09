import { Errors } from "viem"

export class LightSmartAccountUnsupportedVersionError extends Errors.BaseError {
    override name = "LightSmartAccountUnsupportedVersionError"

    constructor({
        entryPointVersion,
        version
    }: {
        entryPointVersion: string
        version?: string | undefined
    }) {
        super(
            `Light Account${version ? ` ${version}` : ""} does not support EntryPoint ${entryPointVersion}.`,
            {
                metaMessages: [
                    "Light Account 1.1.0 requires EntryPoint 0.6, Light Account 2.0.0 requires EntryPoint 0.7."
                ]
            }
        )
    }
}

export class LightSmartAccountEmptyCallsError extends Errors.BaseError {
    override name = "LightSmartAccountEmptyCallsError"

    constructor() {
        super("No calls to encode.")
    }
}
