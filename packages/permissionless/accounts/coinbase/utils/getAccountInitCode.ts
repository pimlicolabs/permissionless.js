import { type Address, type Hex, encodeFunctionData, pad } from "viem"
import { CoinbaseSmartWalletFactoryAbi } from "../abi/CoinbaseSmartWalletFactoryAbi"

export const getAccountInitCode = async (
    owners: Address[],
    index = 0n
): Promise<Hex> => {
    const bytesArray = owners.map((owner) => {
        return pad(owner)
    })

    const initCode = encodeFunctionData({
        abi: CoinbaseSmartWalletFactoryAbi,
        functionName: "createAccount",
        args: [bytesArray, index]
    })

    return initCode
}
