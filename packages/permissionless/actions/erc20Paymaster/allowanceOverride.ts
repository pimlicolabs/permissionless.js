import {
    AbiParameters,
    type Address,
    Hash,
    Hex,
    type StateOverrides
} from "viem/utils"

export type AllowanceOverrideParameters = {
    token: Address.Address
    owner: Address.Address
    spender: Address.Address
    slot: bigint
    amount?: bigint
}

export function allowanceOverride({
    token,
    owner,
    spender,
    slot,
    amount = BigInt(
        "0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
    )
}: AllowanceOverrideParameters): StateOverrides.StateOverrides {
    const smartAccountErc20AllowanceSlot = Hash.keccak256(
        AbiParameters.encode(
            [{ type: "address" }, { type: "bytes32" }],
            [
                spender,
                Hash.keccak256(
                    AbiParameters.encode(
                        [{ type: "address" }, { type: "uint256" }],
                        [owner, BigInt(slot)]
                    )
                )
            ]
        )
    )

    return {
        [token]: {
            stateDiff: {
                [smartAccountErc20AllowanceSlot]: Hex.fromNumber(amount)
            }
        }
    }
}
