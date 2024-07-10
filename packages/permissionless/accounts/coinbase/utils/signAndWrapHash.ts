import type {
    Address,
    Chain,
    Client,
    Hex,
    PublicActions,
    Transport
} from "viem"
import { sign } from "viem/accounts"
import { buildSignatureWrapperForEOA } from "./buildSignatureWrapperForEOA"
import { getAccountInitCode } from "./getAccountInitCode"
import { replaySafeHash } from "./replaySafeHash"

export async function signAndWrapHash<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>({
    client,
    hash,
    smartAccountDeployed,
    privateKey,
    account,
    factory,
    initialOwners,
    index
}: {
    client: Client<TTransport, TChain, undefined, undefined, PublicActions>
    hash: Hex
    smartAccountDeployed: boolean
    privateKey: Hex
    account: Address
    factory: Address
    initialOwners: Address[]
    index: bigint
}): Promise<Hex> {
    let factoryCalldata: Hex = "0x"
    if (!smartAccountDeployed) {
        factoryCalldata = await getAccountInitCode(initialOwners, index)
    }

    // https://github.com/coinbase/smart-wallet/blob/main/src/ERC1271.sol#L69
    const safeHash = await replaySafeHash(client, {
        hash,
        account,
        factory,
        factoryCalldata
    })

    const signature = await sign({
        hash: safeHash,
        privateKey
    })

    // https://github.com/coinbase/smart-wallet/blob/main/src/CoinbaseSmartWallet.sol#L297
    const signatureWrapper = buildSignatureWrapperForEOA({
        signature,
        ownerIndex: 0n
    })

    return signatureWrapper
}
