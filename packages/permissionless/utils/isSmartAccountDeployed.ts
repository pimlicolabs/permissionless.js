import type { Address, Client } from "viem"
import { getCode } from "viem/actions"

export const isSmartAccountDeployed = async (
    client: Client,
    address: Address
): Promise<boolean> => {
    const contractCode = await getCode(client, {
        address: address
    })

    return Boolean(contractCode)
}
