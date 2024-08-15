import { type Address, type Client, concatHex } from "viem"
import type { entryPoint06Address } from "viem/account-abstraction"
import { getSenderAddress } from "../../../actions/public/getSenderAddress"
import { getFactoryData } from "./getFactoryData"

export const getAccountAddress = async <
    entryPointAddress extends
        typeof entryPoint06Address = typeof entryPoint06Address
>(
    client: Client,
    {
        factoryAddress,
        entryPoint: entryPointAddress,
        bytes,
        secp256k1VerificationFacetAddress,
        index = 0n
    }: {
        factoryAddress: Address
        bytes: `0x${string}`
        entryPoint: entryPointAddress
        secp256k1VerificationFacetAddress: Address
        index?: bigint
    }
): Promise<Address> => {
    const factoryData = await getFactoryData({
        bytes,
        index,
        secp256k1VerificationFacetAddress
    })

    return getSenderAddress(client, {
        initCode: concatHex([factoryAddress, factoryData]),
        entryPointAddress: entryPointAddress
    })
}
