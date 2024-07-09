import type { PublicActions, PublicRpcSchema, TypedData } from "viem";
import {
  type Address,
  type Chain,
  type Client,
  type Hex,
  type Transport,
  type TypedDataDefinition,
  concatHex,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  hashMessage,
  pad,
} from "viem";
import { type SignReturnType, sign } from "viem/accounts";
import { getChainId } from "viem/actions";
import { getAccountNonce } from "../../actions/public/getAccountNonce";
import { getSenderAddress } from "../../actions/public/getSenderAddress";
import type { Prettify } from "../../types";
import type {
  ENTRYPOINT_ADDRESS_V06_TYPE,
  ENTRYPOINT_ADDRESS_V07_TYPE,
  EntryPoint,
} from "../../types/entrypoint";
import { getEntryPointVersion } from "../../utils";
import { getUserOperationHash } from "../../utils/getUserOperationHash";
import { isSmartAccountDeployed } from "../../utils/isSmartAccountDeployed";
import { toSmartAccount } from "../toSmartAccount";
import {
  SignTransactionNotSupportedBySmartAccount,
  type SmartAccount,
} from "../types";
import { CoinbaseSmartAccountAbi } from "./abi/CoinbaseSmartAccountAbi";
import { CoinbaseSmartAccountFactoryAbi } from "./abi/CoinbaseSmartAccountFactoryAbi";

const getAccountInitCode = async (
  owners: Address[],
  index = 0n
): Promise<Hex> => {
  const bytesArray = owners.map((owner) => {
    return pad(owner);
  });

  const initCode = encodeFunctionData({
    abi: CoinbaseSmartAccountFactoryAbi,
    functionName: "createAccount",
    args: [bytesArray, index],
  });

  return initCode;
};

const getAccountAddress = async <
  entryPoint extends EntryPoint,
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined
>({
  client,
  factoryAddress,
  entryPoint: entryPointAddress,
  owners,
  index = 0n,
}: {
  client: Client<TTransport, TChain>;
  factoryAddress: Address;
  owners: Address[];
  entryPoint: entryPoint;
  index?: bigint;
}): Promise<Address> => {
  const entryPointVersion = getEntryPointVersion(entryPointAddress);

  const factoryData = await getAccountInitCode(owners, index);

  if (entryPointVersion === "v0.6") {
    return getSenderAddress<ENTRYPOINT_ADDRESS_V06_TYPE>(client, {
      initCode: concatHex([factoryAddress, factoryData]),
      entryPoint: entryPointAddress as ENTRYPOINT_ADDRESS_V06_TYPE,
    });
  }

  // Get the sender address based on the init code
  return getSenderAddress<ENTRYPOINT_ADDRESS_V07_TYPE>(client, {
    factory: factoryAddress,
    factoryData,
    entryPoint: entryPointAddress as ENTRYPOINT_ADDRESS_V07_TYPE,
  });
};

export type SignersToCoinbaseSmartWalletAccountParameters<
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

export type CoinbaseSmartAccount<
  entryPoint extends EntryPoint,
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined
> = SmartAccount<entryPoint, "CoinbaseSmartAccount", transport, chain>;

export async function privateKeyToCoinbaseSmartAccount<
  entryPoint extends EntryPoint,
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined
>(
  client: Client<TTransport, TChain, undefined, PublicRpcSchema, PublicActions>,
  {
    privateKey,
    ownerIndex,
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
      const signature = await sign({
        hash: hashMessage(message),
        privateKey,
      });

      const signatureWrapper = buildSignatureWrapperForEOA({
        signature,
        ownerIndex,
      });

      // TODO - there's something missing here, it doesn't currently work
      throw new Error("[signerToCoinbaseSmartAccount] Not yet implemented");
    },
    signTransaction: (_, __) => {
      throw new SignTransactionNotSupportedBySmartAccount();
    },
    async signTypedData<
      const TTypedData extends TypedData | Record<string, unknown>,
      TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
    >(_typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      throw new Error("[signerToCoinbaseSmartAccount] Not yet implemented");
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
          abi: CoinbaseSmartAccountAbi,
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
        abi: CoinbaseSmartAccountAbi,
        functionName: "execute",
        args: [to, value, data],
      });
    },

    async getDummySignature(_userOperation) {
      return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
    },
  });
}

function buildSignatureWrapperForEOA({
  signature,
  ownerIndex,
}: {
  signature: SignReturnType;
  ownerIndex: bigint;
}): Hex {
  const signatureData = encodePacked(
    ["bytes32", "bytes32", "uint8"],
    // hack hack !
    [signature.r, signature.s, Number.parseInt(signature.v!.toString())]
  );
  return encodeAbiParameters(
    [SignatureWrapperStruct],
    [
      {
        ownerIndex,
        signatureData,
      },
    ]
  );
}

const SignatureWrapperStruct = {
  components: [
    {
      name: "ownerIndex",
      type: "uint8",
    },
    {
      name: "signatureData",
      type: "bytes",
    },
  ],
  name: "SignatureWrapper",
  type: "tuple",
};
