import type { Address, Client, Hex } from "viem"
import { readContract } from "viem/actions"
import { getAction } from "viem/utils"

export type GetAccountAddressParams = {
    adminAddress: Address
    factoryAddress: Address
    salt: Hex
}

export const getAccountAddress = async (
    client: Client,
    args: GetAccountAddressParams
): Promise<Address> => {
    const { adminAddress, factoryAddress, salt } = args

    return getAction(
        client,
        readContract,
        "readContract"
    )({
        address: factoryAddress,
        abi: [
            {
                inputs: [
                    {
                        name: "_adminSigner",
                        type: "address"
                    },
                    {
                        name: "_data",
                        type: "bytes"
                    }
                ],
                name: "getAddress",
                outputs: [
                    {
                        type: "address"
                    }
                ],
                stateMutability: "view",
                type: "function"
            }
        ],
        functionName: "getAddress",
        args: [adminAddress, salt]
    })
}
