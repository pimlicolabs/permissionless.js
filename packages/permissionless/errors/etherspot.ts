import { Errors } from "viem"

export class EtherspotNonceKeyOverflowError extends Errors.BaseError {
    override name = "EtherspotNonceKeyOverflowError"

    constructor({ key }: { key: bigint }) {
        super(
            `Nonce key ${key} exceeds the 2-byte user key field of the Etherspot nonce (max 65535).`
        )
    }
}
