import type {
  Address,
  Chain,
  Client,
  Hex,
  PublicActions,
  Transport,
} from "viem";
import { sign } from "viem/accounts";
import { buildSignatureWrapperForEOA } from "./buildSignatureWrapperForEOA";
import { replaySafeHash } from "./replaySafeHash";

export async function signAndWrapHash<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined
>({
  client,
  hash,
  privateKey,
  account,
  ownerIndex,
}: {
  client: Client<TTransport, TChain, undefined, undefined, PublicActions>;
  hash: Hex;
  privateKey: Hex;
  account: Address;
  ownerIndex: bigint;
}): Promise<Hex> {
  // https://github.com/coinbase/smart-wallet/blob/main/src/ERC1271.sol#L69
  const chainId = await client.getChainId();
  const safeHash = replaySafeHash({
    address: account,
    chainId,
    hash,
  });
  const signature = await sign({
    hash: safeHash,
    privateKey,
  });

  // https://github.com/coinbase/smart-wallet/blob/main/src/CoinbaseSmartWallet.sol#L297
  const signatureWrapper = buildSignatureWrapperForEOA({
    signature,
    ownerIndex,
  });

  return signatureWrapper;
}
