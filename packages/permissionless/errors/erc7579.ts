import { Errors } from "viem"
import type { Hex } from "viem/utils"

export class Erc7579InvalidCallTypeError extends Errors.BaseError {
    override name = "Erc7579InvalidCallTypeError"

    constructor({ callType }: { callType: Hex.Hex }) {
        super(`Unknown ERC-7579 call type ${callType}.`, {
            metaMessages: [
                "Supported call types: 0x00 (call), 0x01 (batchcall), 0xff (delegatecall)."
            ]
        })
    }
}

export class Erc7579InvalidExecutionModeError extends Errors.BaseError {
    override name = "Erc7579InvalidExecutionModeError"

    constructor({ type, calls }: { type: string; calls: number }) {
        super(
            `Execution mode "${type}" cannot encode ${calls} calls; use "batchcall".`
        )
    }
}

export class Erc7579InvalidModuleTypeError extends Errors.BaseError {
    override name = "Erc7579InvalidModuleTypeError"

    constructor({ type }: { type: string }) {
        super(`Unknown ERC-7579 module type "${type}".`, {
            metaMessages: [
                'Supported module types: "validator", "executor", "fallback", "hook".'
            ]
        })
    }
}
