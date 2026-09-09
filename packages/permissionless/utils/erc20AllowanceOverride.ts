import {
    type Address,
    encodeAbiParameters,
    keccak256,
    type StateOverride,
    toHex
} from "viem"

export type Erc20AllowanceOverrideParameters = {
    token: Address
    owner: Address
    spender: Address
    slot: bigint
    amount?: bigint
}

export function erc20AllowanceOverride({
    token,
    owner,
    spender,
    slot,
    amount = BigInt(
        "0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
    )
}: Erc20AllowanceOverrideParameters): StateOverride {
    const smartAccountErc20AllowanceSlot = keccak256(
        encodeAbiParameters(
            [
                {
                    type: "address"
                },
                {
                    type: "bytes32"
                }
            ],
            [
                spender,
                keccak256(
                    encodeAbiParameters(
                        [
                            {
                                type: "address"
                            },
                            {
                                type: "uint256"
                            }
                        ],
                        [owner, BigInt(slot)]
                    )
                )
            ]
        )
    )

    return [
        {
            address: token,
            stateDiff: [
                {
                    slot: smartAccountErc20AllowanceSlot,
                    value: toHex(amount)
                }
            ]
        }
    ]
}
