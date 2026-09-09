import {
    AbiParameters,
    type Address,
    Hash,
    Hex,
    type StateOverrides
} from "viem/utils"

export type Erc20BalanceOverrideParameters = {
    token: Address.Address
    owner: Address.Address
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
}: Erc20BalanceOverrideParameters): StateOverrides.StateOverrides {
    const smartAccountErc20BalanceSlot = Hash.keccak256(
        AbiParameters.encode(
            [{ type: "address" }, { type: "uint256" }],
            [owner, slot]
        )
    )

    return {
        [token]: {
            stateDiff: {
                [smartAccountErc20BalanceSlot]: Hex.fromNumber(balance)
            }
        }
    }
}
