import {
    type Address,
    type StateOverride,
    encodeAbiParameters,
    keccak256,
    toHex
} from "viem"

export type Erc20BalanceOverrideParameters = {
    token: Address
    owner: Address
    slot: bigint
    balance?: bigint
}

export function erc20BalanceOverride({
    token,
    owner,
    slot,
    balance = BigInt(
        "0x100000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
    )
}: Erc20BalanceOverrideParameters): StateOverride {
    const smartAccountErc20BalanceSlot = keccak256(
        encodeAbiParameters(
            [
                {
                    type: "address"
                },
                {
                    type: "uint256"
                }
            ],
            [owner, slot]
        )
    )

    return [
        {
            address: token,
            stateDiff: [
                {
                    slot: smartAccountErc20BalanceSlot,
                    value: toHex(balance)
                }
            ]
        }
    ]
}
