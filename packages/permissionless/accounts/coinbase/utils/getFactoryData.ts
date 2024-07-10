import { type Address, type Hex, encodeFunctionData } from "viem"
import { CoinbaseSmartWalletFactoryAbi } from "../abi/CoinbaseSmartWalletFactoryAbi"

export function getFactoryData({
    owners,
    nonce
}: {
    owners: Address[]
    nonce: bigint
}): Hex {
    return encodeFunctionData({
        abi: CoinbaseSmartWalletFactoryAbi,
        functionName: "createAccount",
        args: [owners, nonce]
    })
}
