import { Address, Hash, hashTypedData, Hex } from "viem";

export function replaySafeHash({
  address,
  chainId,
  hash,
}: {
  address: Address;
  chainId: number;
  hash: Hash;
}): Hex {
  return hashTypedData({
    domain: {
      chainId,
      name: "Coinbase Smart Wallet",
      verifyingContract: address,
      version: "1",
    },
    types: {
      CoinbaseSmartWalletMessage: [
        {
          name: "hash",
          type: "bytes32",
        },
      ],
    },
    primaryType: "CoinbaseSmartWalletMessage",
    message: {
      hash,
    },
  });
}
