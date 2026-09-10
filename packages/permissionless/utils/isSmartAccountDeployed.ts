import { Actions, type Client } from "viem"
import type { Address } from "viem/utils"

export const isSmartAccountDeployed = async (
    client: Client.Client,
    address: Address.Address
): Promise<boolean> => {
    const contractCode = await Actions.address.getCode(client, {
        address: address
    })

    return Boolean(contractCode)
}
