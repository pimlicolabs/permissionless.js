import { type Address, BaseError } from "viem"

export class SmartAccountAlreadyDeployed extends BaseError {
    static message = /aa10/
    override name = "SmartAccountAlreadyDeployed"
    constructor({
        cause,
        sender,
        docsPath
    }: { cause?: BaseError; sender?: Address; docsPath?: string } = {}) {
        super(
            [
                `Smart account ${sender} is already deployed.`,
                `Try setting initCode to "0x"`,
                docsPath ? `Docs: ${docsPath}` : ""
            ].join("\n"),
            {
                cause
            }
        )
    }
}
