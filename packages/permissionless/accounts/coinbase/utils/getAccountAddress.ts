import {
    type Address,
    type Chain,
    type Client,
    type Transport,
    concatHex
} from "viem"
import { getSenderAddress } from "../../../actions"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    EntryPoint
} from "../../../types"
import { getEntryPointVersion } from "../../../utils"
import { getAccountInitCode } from "./getAccountInitCode"

export const getAccountAddress = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>({
    client,
    factoryAddress,
    entryPoint: entryPointAddress,
    owners,
    index = 0n
}: {
    client: Client<TTransport, TChain>
    factoryAddress: Address
    owners: Address[]
    entryPoint: entryPoint
    index?: bigint
}): Promise<Address> => {
    const entryPointVersion = getEntryPointVersion(entryPointAddress)

    const factoryData = await getAccountInitCode(owners, index)

    if (entryPointVersion === "v0.6") {
        return getSenderAddress<ENTRYPOINT_ADDRESS_V06_TYPE>(client, {
            initCode: concatHex([factoryAddress, factoryData]),
            entryPoint: entryPointAddress as ENTRYPOINT_ADDRESS_V06_TYPE
        })
    }

    // Get the sender address based on the init code
    return getSenderAddress<ENTRYPOINT_ADDRESS_V07_TYPE>(client, {
        factory: factoryAddress,
        factoryData,
        entryPoint: entryPointAddress as ENTRYPOINT_ADDRESS_V07_TYPE
    })
}
