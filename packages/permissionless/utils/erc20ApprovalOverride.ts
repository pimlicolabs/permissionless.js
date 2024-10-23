import {
    type Address,
    type StateOverride,
    encodeAbiParameters,
    keccak256,
    toHex
} from "viem"

export type Erc20ApprovalOverrideParameters = {
    token: Address
    owner: Address
    spender: Address
    slot: bigint
    amount?: bigint
}

export function erc20ApprovalOverride({
    token,
    owner,
    spender,
    slot,
    amount = BigInt(
        "0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
    )
}: Erc20ApprovalOverrideParameters): StateOverride {
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