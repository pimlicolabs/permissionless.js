import {
  type Address,
  type Chain,
  type Client,
  type Hex,
  type PublicActions,
  type Transport,
  type TypedData,
  type TypedDataDefinition,
  concatHex,
  encodeFunctionData,
  hashMessage,
  hashTypedData,
} from "viem";
import { sign } from "viem/accounts";
import { getChainId } from "viem/actions";
import type { Prettify } from "viem/chains";
import { toSmartAccount } from "../../accounts";
import { getAccountNonce } from "../../actions/public/getAccountNonce";
import type { EntryPoint } from "../../types/entrypoint";
import {
  getEntryPointVersion,
  getUserOperationHash,
  isSmartAccountDeployed,
} from "../../utils";
import {
  SignTransactionNotSupportedBySmartAccount,
  type SmartAccount,
} from "../types";
import { CoinbaseSmartWalletAbi } from "./abi/CoinbaseSmartWalletAbi";
import { buildSignatureWrapperForEOA } from "./utils/buildSignatureWrapperForEOA";
import { getAccountAddress } from "./utils/getAccountAddress";
import { getAccountInitCode } from "./utils/getAccountInitCode";
import { signAndWrapHash } from "./utils/signAndWrapHash";

export type CoinbaseSmartAccount<
  entryPoint extends EntryPoint,
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined
> = SmartAccount<entryPoint, "CoinbaseSmartAccount", transport, chain>;

type SignersToCoinbaseSmartWalletAccountParameters<
  entryPoint extends EntryPoint
> = Prettify<{
  privateKey: Hex;
  ownerIndex: bigint;
  initialOwners: Address[];
  factoryAddress: Address;
  entryPoint: entryPoint;
  index?: bigint;
  address?: Address;
}>;

export async function privateKeyToCoinbaseSmartAccount<
  entryPoint extends EntryPoint,
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined
>(
  client: Client<TTransport, TChain, undefined, undefined, PublicActions>,
  {
    privateKey,
    ownerIndex = 0n,
    initialOwners,
    factoryAddress,
    entryPoint: entryPointAddress,
    index = 0n,
    address,
  }: SignersToCoinbaseSmartWalletAccountParameters<entryPoint>
): Promise<CoinbaseSmartAccount<entryPoint, TTransport, TChain>> {
  if (getEntryPointVersion(entryPointAddress) !== "v0.6") {
    throw new Error(
      "CoinbaseSmartAccount does not yet support EntryPoint v0.7"
    );
  }

  const [accountAddress, chainId] = await Promise.all([
    address ??
      getAccountAddress<entryPoint, TTransport, TChain>({
        client,
        factoryAddress,
        entryPoint: entryPointAddress,
        owners: initialOwners,
        index,
      }),
    getChainId(client),
  ]);

  let smartAccountDeployed = await isSmartAccountDeployed(
    client,
    accountAddress
  );

  return toSmartAccount({
    address: accountAddress,
    signMessage: async ({ message }) => {
      const hash = hashMessage(message);

      return signAndWrapHash({
        client,
        hash,
        privateKey,
        account: accountAddress,
        ownerIndex,
      });
    },
    signTransaction: (_, __) => {
      throw new SignTransactionNotSupportedBySmartAccount();
    },
    async signTypedData<
      const TTypedData extends TypedData | Record<string, unknown>,
      TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
    >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      const hash = hashTypedData(typedData);

      return signAndWrapHash({
        client,
        hash,
        privateKey,
        account: accountAddress,
        ownerIndex,
      });
    },
    client: client,
    publicKey: accountAddress,
    entryPoint: entryPointAddress,
    source: "CoinbaseSmartAccount",
    async getNonce() {
      return getAccountNonce(client, {
        sender: accountAddress,
        entryPoint: entryPointAddress,
      });
    },
    async signUserOperation(userOperation) {
      const hash = getUserOperationHash({
        userOperation,
        entryPoint: entryPointAddress,
        chainId: chainId,
      });

      const signature = await sign({
        hash,
        privateKey,
      });

      const signatureWrapper = buildSignatureWrapperForEOA({
        signature,
        ownerIndex,
      });

      return signatureWrapper;
    },
    async getInitCode() {
      if (smartAccountDeployed) return "0x";

      smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
      );

      if (smartAccountDeployed) return "0x";

      return concatHex([
        factoryAddress,
        await getAccountInitCode(initialOwners, index),
      ]);
    },
    async getFactory() {
      if (smartAccountDeployed) return undefined;
      smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
      );
      if (smartAccountDeployed) return undefined;
      return factoryAddress;
    },
    async getFactoryData() {
      if (smartAccountDeployed) return undefined;
      smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
      );
      if (smartAccountDeployed) return undefined;
      return getAccountInitCode(initialOwners, index);
    },
    async encodeDeployCallData(_) {
      throw new Error(
        "CoinbaseSmartAccount does not support account deployment"
      );
    },
    async encodeCallData(args) {
      if (Array.isArray(args)) {
        const argsArray = args as {
          to: Address;
          value: bigint;
          data: Hex;
        }[];

        const calls = argsArray.map((a) => {
          return {
            target: a.to,
            value: a.value,
            data: a.data,
          };
        });

        return encodeFunctionData({
          abi: CoinbaseSmartWalletAbi,
          functionName: "executeBatch",
          args: [calls],
        });
      }

      const { to, value, data } = args as {
        to: Address;
        value: bigint;
        data: Hex;
      };

      return encodeFunctionData({
        abi: CoinbaseSmartWalletAbi,
        functionName: "execute",
        args: [to, value, data],
      });
    },

    async getDummySignature(_userOperation) {
      return buildSignatureWrapperForEOA({
        signature: {
          r: "0x0000000000000000000000000000000000000000000000000000000000000000",
          s: "0x0000000000000000000000000000000000000000000000000000000000000000",
          v: 0n,
        },
        ownerIndex,
      });
    },
  });
}
