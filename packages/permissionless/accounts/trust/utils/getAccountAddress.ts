import {
    type Address,
    type Chain,
    type Client,
    type Transport,
    concatHex
} from "viem"
import { getSenderAddress } from "../../../actions/public/getSenderAddress"
import type { ENTRYPOINT_ADDRESS_V06_TYPE, EntryPoint } from "../../../types"
import { getFactoryData } from "./getFactoryData"

export const getAccountAddress = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, undefined>,
    {
        factoryAddress,
        entryPoint: entryPointAddress,
        owner,
        bytes,
        index = 0n
    }: {
        factoryAddress: Address
        owner: Address
        bytes: `0x${string}`
        entryPoint: entryPoint
        index?: bigint
    }
): Promise<Address> => {
    const factoryData = await getFactoryData({
        account: { address: owner, type: "json-rpc" },
        bytes,
        index
    })

    console.log('getAccountAddress')
    console.log(factoryAddress);
    console.log(factoryData);

    return getSenderAddress(client, {
        initCode: concatHex([factoryAddress, factoryData]),
        entryPoint: entryPointAddress as ENTRYPOINT_ADDRESS_V06_TYPE
    })
}
