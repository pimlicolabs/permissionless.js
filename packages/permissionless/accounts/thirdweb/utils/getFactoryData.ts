import type { Address, Hex } from "viem"
import { encodeFunctionData } from "viem"

export const getFactoryData = async ({
    admin,
    salt
}: {
    admin: Address
    salt: Hex
}) => {
    return encodeFunctionData({
        abi: [
            {
                inputs: [
                    {
                        internalType: "address",
                        name: "_admin",
                        type: "address"
                    },
                    {
                        internalType: "bytes",
                        name: "_salt",
                        type: "bytes"
                    }
                ],
                name: "createAccount",
                outputs: [
                    {
                        internalType: "address",
                        type: "address"
                    }
                ],
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        functionName: "createAccount",
        args: [admin, salt]
    })
}
