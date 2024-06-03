import {
    type Address,
    type StateOverride,
    encodeAbiParameters,
    keccak256,
    toHex
} from "viem"

export function getEntryPointPaymasterDepositOverrides({
    entryPoint,
    paymaster,
    amount
}: {
    entryPoint: Address
    paymaster: Address
    amount: bigint
}): StateOverride {
    return [
        {
            address: entryPoint,
            stateDiff: [
                {
                    slot: keccak256(
                        encodeAbiParameters(
                            [
                                {
                                    type: "address"
                                },
                                {
                                    type: "uint256"
                                }
                            ],
                            [paymaster, BigInt(0)]
                        )
                    ),
                    value: toHex(amount)
                }
            ]
        }
    ]
}
