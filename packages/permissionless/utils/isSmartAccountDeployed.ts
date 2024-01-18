import type { Address, Client } from "viem"
import { getBytecode } from "viem/actions"

export const isSmartAccountDeployed = async (
    client: Client,
    address: Address
): Promise<boolean> => {
    const contractCode = await getBytecode(client, {
        address: address
    })

    if ((contractCode?.length ?? 0) > 2) {
        return true
    }
    return false
}
