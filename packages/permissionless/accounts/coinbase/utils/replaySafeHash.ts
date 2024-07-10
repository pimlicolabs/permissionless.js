import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type PublicActions,
    type Transport,
    encodeDeployData
} from "viem"
import { ERC1271InputGeneratorAbi } from "../abi/ERC1271InputGeneratorAbi"
import { ERC1271InputGeneratorByteCode } from "../constants"

export async function replaySafeHash<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain, undefined, undefined, PublicActions>,
    {
        hash,
        account,
        factory,
        factoryCalldata
    }: {
        hash: Hex
        account: Address
        factory: Address
        factoryCalldata?: Hex
    }
): Promise<Hex> {
    const data = encodeDeployData({
        bytecode: ERC1271InputGeneratorByteCode,
        abi: ERC1271InputGeneratorAbi,
        args: [account, hash, factory, factoryCalldata || "0x"]
    })

    const { data: safeHash } = await client.call({ data })
    if (!safeHash) throw new Error("failed to fetch replay safe hash")

    return safeHash
}
