import { Base64, Hex, PublicKey } from "ox"
import type {
    Account,
    Assign,
    Chain,
    JsonRpcAccount,
    OneOf,
    PrivateKeyAccount,
    Transport,
    WalletClient
} from "viem"
import {
    type Address,
    type Client,
    type LocalAccount,
    type TypedDataDefinition,
    concatHex,
    encodeAbiParameters,
    encodeFunctionData,
    keccak256,
    toHex,
    zeroAddress
} from "viem"
import {
    type SmartAccount,
    type SmartAccountImplementation,
    type UserOperation,
    type WebAuthnAccount,
    entryPoint06Abi,
    entryPoint07Abi,
    entryPoint07Address,
    getUserOperationHash,
    toSmartAccount
} from "viem/account-abstraction"
import { getChainId } from "viem/actions"
import { getAction } from "viem/utils"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"
import { getSenderAddress } from "../../actions/public/getSenderAddress.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"
import { KernelInitAbi } from "./abi/KernelAccountAbi.js"
import {
    KernelV3InitAbi,
    KernelV3_1AccountAbi
} from "./abi/KernelV3AccountAbi.js"
import { KernelV3FactoryAbi } from "./abi/KernelV3FactoryAbi.js"
import { KernelV3MetaFactoryDeployWithFactoryAbi } from "./abi/KernelV3MetaFactoryAbi.js"
import {
    DUMMY_ECDSA_SIGNATURE,
    ROOT_MODE_KERNEL_V2,
    VALIDATOR_TYPE
} from "./constants.js"
import { decodeCallData } from "./utils/decodeCallData.js"
import { encodeCallData } from "./utils/encodeCallData.js"
import { getNonceKeyWithEncoding } from "./utils/getNonceKey.js"
import { isKernelV2 } from "./utils/isKernelV2.js"
import { isWebAuthnAccount } from "./utils/isWebAuthnAccount.js"
import { signMessage } from "./utils/signMessage.js"
import { signTypedData } from "./utils/signTypedData.js"

type EntryPointVersion = "0.6" | "0.7"

/**
 * The account creation ABI for a kernel smart account (from the KernelFactory)
 */
const createAccountAbi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "_implementation",
                type: "address"
            },
            {
                internalType: "bytes",
                name: "_data",
                type: "bytes"
            },
            {
                internalType: "uint256",
                name: "_index",
                type: "uint256"
            }
        ],
        name: "createAccount",
        outputs: [
            {
                internalType: "address",
                name: "proxy",
                type: "address"
            }
        ],
        stateMutability: "payable",
        type: "function"
    }
] as const

export type KernelVersion<entryPointVersion extends EntryPointVersion> =
    entryPointVersion extends "0.6"
        ? "0.2.1" | "0.2.2" | "0.2.3" | "0.2.4"
        : "0.3.0-beta" | "0.3.1" | "0.3.2" | "0.3.3"

/**
 * Default addresses map for different kernel smart account versions
 */
export const KERNEL_VERSION_TO_ADDRESSES_MAP: {
    [key in KernelVersion<EntryPointVersion>]: {
        ECDSA_VALIDATOR: Address
        WEB_AUTHN_VALIDATOR?: Address
        ACCOUNT_LOGIC: Address
        FACTORY_ADDRESS: Address
        META_FACTORY_ADDRESS?: Address
    }
} = {
    "0.2.1": {
        ECDSA_VALIDATOR: "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390",
        ACCOUNT_LOGIC: "0xf048AD83CB2dfd6037A43902a2A5Be04e53cd2Eb",
        FACTORY_ADDRESS: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3"
    },
    "0.2.2": {
        ECDSA_VALIDATOR: "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390",
        ACCOUNT_LOGIC: "0x0DA6a956B9488eD4dd761E59f52FDc6c8068E6B5",
        FACTORY_ADDRESS: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3"
    },
    "0.2.3": {
        ECDSA_VALIDATOR: "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390",
        ACCOUNT_LOGIC: "0xD3F582F6B4814E989Ee8E96bc3175320B5A540ab",
        FACTORY_ADDRESS: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3"
    },
    "0.2.4": {
        ECDSA_VALIDATOR: "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390",
        ACCOUNT_LOGIC: "0xd3082872F8B06073A021b4602e022d5A070d7cfC",
        FACTORY_ADDRESS: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3"
    },
    "0.3.0-beta": {
        ECDSA_VALIDATOR: "0x8104e3Ad430EA6d354d013A6789fDFc71E671c43",
        ACCOUNT_LOGIC: "0x94F097E1ebEB4ecA3AAE54cabb08905B239A7D27",
        FACTORY_ADDRESS: "0x6723b44Abeec4E71eBE3232BD5B455805baDD22f",
        META_FACTORY_ADDRESS: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5",
        WEB_AUTHN_VALIDATOR: "0xbA45a2BFb8De3D24cA9D7F1B551E14dFF5d690Fd"
    },
    "0.3.1": {
        ECDSA_VALIDATOR: "0x845ADb2C711129d4f3966735eD98a9F09fC4cE57",
        ACCOUNT_LOGIC: "0xBAC849bB641841b44E965fB01A4Bf5F074f84b4D",
        FACTORY_ADDRESS: "0xaac5D4240AF87249B3f71BC8E4A2cae074A3E419",
        META_FACTORY_ADDRESS: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5",
        WEB_AUTHN_VALIDATOR: "0xbA45a2BFb8De3D24cA9D7F1B551E14dFF5d690Fd"
    },
    "0.3.2": {
        ECDSA_VALIDATOR: "0x845ADb2C711129d4f3966735eD98a9F09fC4cE57",
        ACCOUNT_LOGIC: "0xD830D15D3dc0C269F3dBAa0F3e8626d33CFdaBe1",
        FACTORY_ADDRESS: "0x7a1dBAB750f12a90EB1B60D2Ae3aD17D4D81EfFe",
        META_FACTORY_ADDRESS: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5"
    },
    "0.3.3": {
        ECDSA_VALIDATOR: "0x845ADb2C711129d4f3966735eD98a9F09fC4cE57",
        ACCOUNT_LOGIC: "0xd6CEDDe84be40893d153Be9d467CD6aD37875b28",
        FACTORY_ADDRESS: "0x2577507b78c2008Ff367261CB6285d44ba5eF2E9",
        META_FACTORY_ADDRESS: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5"
    }
}

/**
 * Get supported Kernel Smart Account version based on entryPoint
 * @param entryPoint
 */
const getDefaultKernelVersion = <TEntryPointVersion extends EntryPointVersion>(
    entryPointVersion: TEntryPointVersion,
    version?: KernelVersion<TEntryPointVersion>,
    eip7702?: boolean
): KernelVersion<TEntryPointVersion> => {
    if (eip7702) {
        return "0.3.3" as KernelVersion<TEntryPointVersion>
    }

    if (version) {
        return version
    }
    return (
        entryPointVersion === "0.6" ? "0.2.2" : "0.3.0-beta"
    ) as KernelVersion<TEntryPointVersion>
}

type KERNEL_ADDRESSES = {
    validatorAddress?: Address
    accountLogicAddress: Address
    factoryAddress: Address
    metaFactoryAddress: Address
}

/**
 * Get default addresses for Kernel Smart Account based on entryPoint or user input
 * @param entryPointAddress
 * @param ecdsaValidatorAddress
 * @param accountLogicAddress
 * @param factoryAddress
 * @param metaFactoryAddress
 */
const getDefaultAddresses = ({
    validatorAddress: _validatorAddress,
    accountLogicAddress: _accountLogicAddress,
    factoryAddress: _factoryAddress,
    metaFactoryAddress: _metaFactoryAddress,
    kernelVersion,
    isWebAuthn
}: Partial<KERNEL_ADDRESSES> & {
    kernelVersion: KernelVersion<EntryPointVersion>
    isWebAuthn: boolean
}): KERNEL_ADDRESSES => {
    const addresses = KERNEL_VERSION_TO_ADDRESSES_MAP[kernelVersion]
    const validatorAddress =
        _validatorAddress ??
        (isWebAuthn ? addresses.WEB_AUTHN_VALIDATOR : addresses.ECDSA_VALIDATOR)
    const accountLogicAddress = _accountLogicAddress ?? addresses.ACCOUNT_LOGIC
    const factoryAddress = _factoryAddress ?? addresses.FACTORY_ADDRESS
    const metaFactoryAddress =
        _metaFactoryAddress ?? addresses?.META_FACTORY_ADDRESS ?? zeroAddress // Meta Factory doesn't exists for Kernel v2.2

    return {
        validatorAddress,
        accountLogicAddress,
        factoryAddress,
        metaFactoryAddress
    }
}

export const getEcdsaRootIdentifierForKernelV3 = (
    validatorAddress: Address,
    eip7702 = false
) => {
    return concatHex([
        eip7702 ? VALIDATOR_TYPE.EIP7702 : VALIDATOR_TYPE.VALIDATOR,
        eip7702 ? "0x" : validatorAddress
    ])
}

/**
 * Get the initialization data for a kernel smart account
 * @param entryPoint
 * @param owner
 * @param ecdsaValidatorAddress
 */
const getInitializationData = <entryPointVersion extends EntryPointVersion>({
    entryPoint: { version: entryPointVersion },
    kernelVersion,
    validatorData,
    validatorAddress
}: {
    kernelVersion: KernelVersion<entryPointVersion>
    entryPoint: {
        version: entryPointVersion
    }
    validatorData: Hex.Hex
    validatorAddress: Address
}) => {
    if (entryPointVersion === "0.6") {
        return encodeFunctionData({
            abi: KernelInitAbi,
            functionName: "initialize",
            args: [validatorAddress, validatorData]
        })
    }

    if (kernelVersion === "0.3.0-beta") {
        return encodeFunctionData({
            abi: KernelV3InitAbi,
            functionName: "initialize",
            args: [
                getEcdsaRootIdentifierForKernelV3(validatorAddress),
                zeroAddress,
                validatorData,
                "0x"
            ]
        })
    }

    return encodeFunctionData({
        abi: KernelV3_1AccountAbi,
        functionName: "initialize",
        args: [
            getEcdsaRootIdentifierForKernelV3(validatorAddress),
            zeroAddress,
            validatorData,
            "0x",
            []
        ]
    })
}

const getValidatorData = async (owner: WebAuthnAccount | LocalAccount) => {
    if (owner.type === "local") {
        return owner.address
    }

    if (isWebAuthnAccount(owner)) {
        const parsedPublicKey = PublicKey.fromHex(owner.publicKey)
        const authenticatorIdHash = keccak256(
            Hex.fromBytes(Base64.toBytes(owner.id))
        )

        return encodeAbiParameters(
            [
                {
                    components: [
                        { name: "x", type: "uint256" },
                        { name: "y", type: "uint256" }
                    ],
                    name: "webAuthnData",
                    type: "tuple"
                },
                {
                    name: "authenticatorIdHash",
                    type: "bytes32"
                }
            ],
            [
                {
                    x: parsedPublicKey.x,
                    y: parsedPublicKey.y
                },
                authenticatorIdHash
            ]
        )
    }

    throw new Error("Invalid owner type")
}

/**
 * Get the account initialization code for a kernel smart account
 * @param entryPoint
 * @param owner
 * @param index
 * @param factoryAddress
 * @param accountLogicAddress
 * @param ecdsaValidatorAddress
 */
const getAccountInitCode = async <entryPointVersion extends EntryPointVersion>({
    entryPointVersion,
    kernelVersion,
    validatorData,
    index,
    factoryAddress,
    accountLogicAddress,
    validatorAddress,
    useMetaFactory
}: {
    kernelVersion: KernelVersion<entryPointVersion>
    entryPointVersion: entryPointVersion
    validatorData: Hex.Hex
    index: bigint
    factoryAddress: Address
    accountLogicAddress: Address
    validatorAddress: Address
    useMetaFactory: boolean
}): Promise<Hex.Hex> => {
    // Build the account initialization data
    const initializationData = getInitializationData({
        entryPoint: { version: entryPointVersion },
        kernelVersion,
        validatorAddress,
        validatorData
    })

    // Build the account init code

    if (entryPointVersion === "0.6") {
        return encodeFunctionData({
            abi: createAccountAbi,
            functionName: "createAccount",
            args: [accountLogicAddress, initializationData, index]
        })
    }

    if (!useMetaFactory) {
        return encodeFunctionData({
            abi: KernelV3FactoryAbi,
            functionName: "createAccount",
            args: [initializationData, toHex(index, { size: 32 })]
        })
    }

    return encodeFunctionData({
        abi: KernelV3MetaFactoryDeployWithFactoryAbi,
        functionName: "deployWithFactory",
        args: [factoryAddress, initializationData, toHex(index, { size: 32 })]
    })
}

export type ToKernelSmartAccountParameters<
    entryPointVersion extends EntryPointVersion,
    kernelVersion extends KernelVersion<entryPointVersion>,
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
        | WebAuthnAccount
    >,
    eip7702 extends boolean = false
> = {
    client: Client<
        Transport,
        Chain | undefined,
        JsonRpcAccount | LocalAccount | undefined
    >
    version?: kernelVersion
    eip7702?: eip7702
} & (eip7702 extends true
    ? {
          owner: OneOf<
              | EthereumProvider
              | WalletClient<Transport, Chain | undefined, Account>
              | LocalAccount
          >
          entryPoint?: {
              address: Address
              version: "0.7"
          }
          address?: never
          index?: never
          factoryAddress?: never
          metaFactoryAddress?: never
          accountLogicAddress?: Address
          validatorAddress?: never
          nonceKey?: never
          useMetaFactory?: never
      }
    : {
          entryPoint?: {
              address: Address
              version: entryPointVersion
          }
          owners: [owner]
          address?: Address
          index?: bigint
          factoryAddress?: Address
          metaFactoryAddress?: Address
          accountLogicAddress?: Address
          validatorAddress?: Address
          nonceKey?: bigint
          useMetaFactory?: boolean | "optional"
      })

export type KernelSmartAccountImplementation<
    entryPointVersion extends EntryPointVersion = "0.7",
    eip7702 extends boolean = false
> = Assign<
    SmartAccountImplementation<
        entryPointVersion extends "0.6"
            ? typeof entryPoint06Abi
            : typeof entryPoint07Abi,
        entryPointVersion,
        eip7702 extends true
            ? {
                  implementation: Address
              }
            : object,
        eip7702
        // {
        //     // entryPoint === ENTRYPOINT_ADDRESS_V06 ? "0.2.2" : "0.3.0-beta"
        //     abi: entryPointVersion extends "0.6" ? typeof BiconomyAbi
        //     factory: { abi: typeof FactoryAbi; address: Address }
        // }
    >,
    { sign: NonNullable<SmartAccountImplementation["sign"]> }
>

export type ToKernelSmartAccountReturnType<
    entryPointVersion extends EntryPointVersion = "0.7",
    eip7702 extends boolean = false
> = eip7702 extends true
    ? SmartAccount<KernelSmartAccountImplementation<entryPointVersion, true>>
    : SmartAccount<KernelSmartAccountImplementation<entryPointVersion, false>>
/**
 * Build a kernel smart account from a private key, that use the ECDSA or passkeys signer behind the scene
 * @param client
 * @param privateKey
 * @param entryPoint
 * @param index
 * @param factoryAddress
 * @param accountLogicAddress
 * @param validatorAddress
 */
export async function toKernelSmartAccount<
    entryPointVersion extends EntryPointVersion,
    kernelVersion extends KernelVersion<entryPointVersion>,
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
        | WebAuthnAccount
    >,
    eip7702 extends boolean = false
>(
    parameters: ToKernelSmartAccountParameters<
        entryPointVersion,
        kernelVersion,
        owner,
        eip7702
    >
): Promise<ToKernelSmartAccountReturnType<entryPointVersion, eip7702>> {
    const {
        client,
        address,
        index = 0n,
        version,
        validatorAddress: _validatorAddress,
        factoryAddress: _factoryAddress,
        metaFactoryAddress: _metaFactoryAddress,
        accountLogicAddress: _accountLogicAddress,
        useMetaFactory = true,
        eip7702 = false
    } = parameters

    const owners = (() => {
        if (eip7702 && "owner" in parameters) {
            return [parameters.owner]
        }

        if ("owners" in parameters) {
            return parameters.owners
        }

        throw new Error("Invalid parameters")
    })()

    const isWebAuthn = owners[0].type === "webAuthn"

    const owner = await (() => {
        if (isWebAuthn) {
            return owners[0] as WebAuthnAccount
        }
        return toOwner({
            owner: owners[0] as OneOf<
                | EthereumProvider
                | WalletClient<Transport, Chain | undefined, Account>
                | LocalAccount
            >
        })
    })()

    const entryPoint = (() => {
        const address = parameters.entryPoint?.address ?? entryPoint07Address
        const version = parameters.entryPoint?.version ?? "0.7"

        let abi: typeof entryPoint06Abi | typeof entryPoint07Abi =
            entryPoint07Abi

        if (version === "0.6") {
            abi = entryPoint06Abi
        }

        return {
            address,
            abi,
            version
        } as const
    })()

    const kernelVersion = getDefaultKernelVersion(
        entryPoint.version,
        version,
        eip7702
    )

    const {
        accountLogicAddress,
        validatorAddress,
        factoryAddress,
        metaFactoryAddress
    } = getDefaultAddresses({
        validatorAddress: _validatorAddress,
        accountLogicAddress: _accountLogicAddress,
        factoryAddress: _factoryAddress,
        metaFactoryAddress: _metaFactoryAddress,
        kernelVersion,
        isWebAuthn
    })

    if (!validatorAddress) {
        throw new Error("Validator address is required")
    }

    // Helper to generate the init code for the smart account
    const generateInitCode = async (_useMetaFactory: boolean) =>
        getAccountInitCode({
            entryPointVersion: entryPoint.version,
            kernelVersion,
            validatorData: await getValidatorData(owner),
            index,
            factoryAddress,
            accountLogicAddress,
            validatorAddress,
            useMetaFactory: _useMetaFactory
        })

    let chainId: number

    const getMemoizedChainId = async () => {
        if (chainId) return chainId
        chainId = client.chain
            ? client.chain.id
            : await getAction(client, getChainId, "getChainId")({})
        return chainId
    }

    const getFactoryArgsFunc = (_useMetaFactory: boolean) => async () => {
        return {
            factory:
                entryPoint.version === "0.6" || _useMetaFactory === false
                    ? factoryAddress
                    : metaFactoryAddress,
            factoryData: await generateInitCode(_useMetaFactory)
        }
    }

    const { accountAddress, getFactoryArgs } = await (async () => {
        if (eip7702) {
            return {
                accountAddress: (owner as LocalAccount).address,
                getFactoryArgs: async () => {
                    return {
                        factory: undefined,
                        factoryData: undefined
                    }
                }
            }
        }

        let getFactoryArgs = getFactoryArgsFunc(
            useMetaFactory === "optional" ? true : useMetaFactory
        )

        if (address && useMetaFactory !== "optional") {
            return { accountAddress: address, getFactoryArgs }
        }

        const { factory, factoryData } = await getFactoryArgs()

        let accountAddress = await getSenderAddress(client, {
            factory,
            factoryData,
            entryPointAddress: entryPoint.address
        })

        if (address === accountAddress) {
            return { accountAddress, getFactoryArgs }
        }

        if (useMetaFactory === "optional" && accountAddress === zeroAddress) {
            getFactoryArgs = getFactoryArgsFunc(false)
            const { factory, factoryData } = await getFactoryArgs()

            accountAddress = await getSenderAddress(client, {
                factory,
                factoryData,
                entryPointAddress: entryPoint.address
            })
        }

        return { accountAddress, getFactoryArgs }
    })()

    return toSmartAccount({
        client,
        entryPoint,
        getFactoryArgs,
        extend: eip7702
            ? {
                  implementation: accountLogicAddress
              }
            : undefined,
        authorization: eip7702
            ? {
                  address: accountLogicAddress,
                  account: owner as PrivateKeyAccount
              }
            : undefined,
        async getAddress() {
            return accountAddress
        },
        async encodeCalls(calls) {
            return encodeCallData({ calls, kernelVersion })
        },
        async decodeCalls(callData) {
            return decodeCallData({ callData, kernelVersion })
        },
        async getNonce(_args) {
            return getAccountNonce(client, {
                address: await this.getAddress(),
                entryPointAddress: entryPoint.address,
                key: getNonceKeyWithEncoding(
                    kernelVersion,
                    validatorAddress,
                    /*args?.key ?? */ parameters.nonceKey ?? 0n
                )
            })
        },
        async getStubSignature() {
            if (isKernelV2(kernelVersion)) {
                return concatHex([ROOT_MODE_KERNEL_V2, DUMMY_ECDSA_SIGNATURE])
            }

            if (isWebAuthnAccount(owner)) {
                return encodeAbiParameters(
                    [
                        { name: "authenticatorData", type: "bytes" },
                        { name: "clientDataJSON", type: "string" },
                        { name: "responseTypeLocation", type: "uint256" },
                        { name: "r", type: "uint256" },
                        { name: "s", type: "uint256" },
                        { name: "usePrecompiled", type: "bool" }
                    ],
                    [
                        "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d00000000",
                        '{"type":"webauthn.get","challenge":"tbxXNFS9X_4Byr1cMwqKrIGB-_30a0QhZ6y7ucM0BOE","origin":"http://localhost:3000","crossOrigin":false, "other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"}',
                        1n,
                        44941127272049826721201904734628716258498742255959991581049806490182030242267n,
                        9910254599581058084911561569808925251374718953855182016200087235935345969636n,
                        false
                    ]
                )
            }

            return DUMMY_ECDSA_SIGNATURE
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        async signMessage({ message }) {
            if (
                "isDeployed" in this &&
                !(await (this as any).isDeployed()) &&
                eip7702
            ) {
                throw new Error(
                    "Kernel with EIP-7702 isn't 1271 compliant before delegation."
                )
            }

            const signature = await signMessage({
                owner,
                message,
                accountAddress: await this.getAddress(),
                kernelVersion: kernelVersion,
                chainId: await getMemoizedChainId(),
                eip7702: eip7702
            })

            if (isKernelV2(kernelVersion)) {
                return signature
            }

            return concatHex([
                getEcdsaRootIdentifierForKernelV3(validatorAddress, eip7702),
                signature
            ])
        },
        async signTypedData(typedData) {
            if (
                "isDeployed" in this &&
                !(await (this as any).isDeployed()) &&
                eip7702
            ) {
                throw new Error(
                    "Kernel with EIP-7702 isn't 1271 compliant before delegation."
                )
            }

            const signature = await signTypedData({
                owner: owner,
                chainId: await getMemoizedChainId(),
                ...(typedData as TypedDataDefinition),
                accountAddress: await this.getAddress(),
                kernelVersion: kernelVersion,
                eip7702
            })

            if (isKernelV2(kernelVersion)) {
                return signature
            }

            return concatHex([
                getEcdsaRootIdentifierForKernelV3(validatorAddress, eip7702),
                signature
            ])
        },
        // Sign a user operation
        async signUserOperation(parameters) {
            const { chainId = await getMemoizedChainId(), ...userOperation } =
                parameters

            const hash = getUserOperationHash({
                userOperation: {
                    ...userOperation,
                    sender: userOperation.sender ?? (await this.getAddress()),
                    signature: "0x"
                } as UserOperation<entryPointVersion>,
                entryPointAddress: entryPoint.address,
                entryPointVersion: entryPoint.version,
                chainId: chainId
            })

            const signature = isWebAuthnAccount(owner)
                ? await signMessage({
                      owner,
                      message: { raw: hash },
                      chainId,
                      accountAddress: await this.getAddress(),
                      kernelVersion,
                      eip7702: false
                  })
                : await owner.signMessage({
                      message: { raw: hash }
                  })

            // Always use the sudo mode, since we will use external paymaster
            if (isKernelV2(kernelVersion)) {
                return concatHex(["0x00000000", signature])
            }
            return signature
        }
    }) as Promise<ToKernelSmartAccountReturnType<entryPointVersion, eip7702>>
}
