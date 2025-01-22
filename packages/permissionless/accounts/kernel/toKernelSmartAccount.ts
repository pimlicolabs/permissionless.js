import type {
    Account,
    Assign,
    Chain,
    OneOf,
    Transport,
    WalletClient
} from "viem"
import {
    type Address,
    type Client,
    type Hex,
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
import { signMessage as _signMessage, getChainId } from "viem/actions"
import { getAction } from "viem/utils"
import { base64UrlToBytes, bytesToHex, parsePublicKey } from "webauthn-p256"
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

export type KernelVersion<entryPointVersion extends "0.6" | "0.7"> =
    entryPointVersion extends "0.6"
        ? "0.2.1" | "0.2.2" | "0.2.3" | "0.2.4"
        : "0.3.0-beta" | "0.3.1"

/**
 * Default addresses map for different kernel smart account versions
 */
export const KERNEL_VERSION_TO_ADDRESSES_MAP: {
    [key in KernelVersion<"0.6" | "0.7">]: {
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
    }
}

/**
 * Get supported Kernel Smart Account version based on entryPoint
 * @param entryPoint
 */
const getDefaultKernelVersion = <TEntryPointVersion extends "0.6" | "0.7">(
    entryPointVersion: TEntryPointVersion,
    version?: KernelVersion<TEntryPointVersion>
): KernelVersion<TEntryPointVersion> => {
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
    kernelVersion: KernelVersion<"0.6" | "0.7">
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
    validatorAddress: Address
) => {
    return concatHex([VALIDATOR_TYPE.VALIDATOR, validatorAddress])
}

/**
 * Get the initialization data for a kernel smart account
 * @param entryPoint
 * @param owner
 * @param ecdsaValidatorAddress
 */
const getInitializationData = <entryPointVersion extends "0.6" | "0.7">({
    entryPoint: { version: entryPointVersion },
    kernelVersion,
    validatorData,
    validatorAddress
}: {
    kernelVersion: KernelVersion<entryPointVersion>
    entryPoint: {
        version: entryPointVersion
    }
    validatorData: Hex
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
        const parsedPublicKey = parsePublicKey(owner.publicKey)
        const authenticatorIdHash = keccak256(
            bytesToHex(base64UrlToBytes(owner.id))
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
const getAccountInitCode = async <entryPointVersion extends "0.6" | "0.7">({
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
    validatorData: Hex
    index: bigint
    factoryAddress: Address
    accountLogicAddress: Address
    validatorAddress: Address
    useMetaFactory: boolean
}): Promise<Hex> => {
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
    entryPointVersion extends "0.6" | "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>,
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
        | WebAuthnAccount
    >
> = {
    client: Client
    owners: [owner]
    entryPoint?: {
        address: Address
        version: entryPointVersion
    }
    address?: Address
    version?: kernelVersion
    index?: bigint
    factoryAddress?: Address
    metaFactoryAddress?: Address
    accountLogicAddress?: Address
    validatorAddress?: Address
    nonceKey?: bigint
    useMetaFactory?: boolean
}

export type KernelSmartAccountImplementation<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
> = Assign<
    SmartAccountImplementation<
        entryPointVersion extends "0.6"
            ? typeof entryPoint06Abi
            : typeof entryPoint07Abi,
        entryPointVersion
        // {
        //     // entryPoint === ENTRYPOINT_ADDRESS_V06 ? "0.2.2" : "0.3.0-beta"
        //     abi: entryPointVersion extends "0.6" ? typeof BiconomyAbi
        //     factory: { abi: typeof FactoryAbi; address: Address }
        // }
    >,
    { sign: NonNullable<SmartAccountImplementation["sign"]> }
>

export type ToKernelSmartAccountReturnType<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
> = SmartAccount<KernelSmartAccountImplementation<entryPointVersion>>
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
    entryPointVersion extends "0.6" | "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>,
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
        | WebAuthnAccount
    >
>(
    parameters: ToKernelSmartAccountParameters<
        entryPointVersion,
        kernelVersion,
        owner
    >
): Promise<ToKernelSmartAccountReturnType<entryPointVersion>> {
    const {
        client,
        address,
        index = 0n,
        owners,
        version,
        validatorAddress: _validatorAddress,
        factoryAddress: _factoryAddress,
        metaFactoryAddress: _metaFactoryAddress,
        accountLogicAddress: _accountLogicAddress,
        useMetaFactory = true
    } = parameters

    const isWebAuthn = owners[0].type === "webAuthn"

    const owner = isWebAuthn
        ? (owners[0] as WebAuthnAccount)
        : await toOwner({
              owner: owners[0] as OneOf<
                  | EthereumProvider
                  | WalletClient<Transport, Chain | undefined, Account>
                  | LocalAccount
              >
          })

    const entryPoint = {
        address: parameters.entryPoint?.address ?? entryPoint07Address,
        abi:
            (parameters.entryPoint?.version ?? "0.7") === "0.6"
                ? entryPoint06Abi
                : entryPoint07Abi,
        version: parameters.entryPoint?.version ?? "0.7"
    } as const

    const kernelVersion = getDefaultKernelVersion(entryPoint.version, version)

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
    const generateInitCode = async () =>
        getAccountInitCode({
            entryPointVersion: entryPoint.version,
            kernelVersion,
            validatorData: await getValidatorData(owner),
            index,
            factoryAddress,
            accountLogicAddress,
            validatorAddress,
            useMetaFactory
        })

    let accountAddress: Address | undefined = address

    let chainId: number

    const getMemoizedChainId = async () => {
        if (chainId) return chainId
        chainId = client.chain
            ? client.chain.id
            : await getAction(client, getChainId, "getChainId")({})
        return chainId
    }

    const getFactoryArgs = async () => {
        return {
            factory:
                entryPoint.version === "0.6" || useMetaFactory === false
                    ? factoryAddress
                    : metaFactoryAddress,
            factoryData: await generateInitCode()
        }
    }

    return toSmartAccount({
        client,
        entryPoint,
        getFactoryArgs,
        async getAddress() {
            if (accountAddress) return accountAddress

            const { factory, factoryData } = await getFactoryArgs()

            // Get the sender address based on the init code
            accountAddress = await getSenderAddress(client, {
                factory,
                factoryData,
                entryPointAddress: entryPoint.address
            })

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
            const signature = await signMessage({
                owner,
                message,
                accountAddress: await this.getAddress(),
                kernelVersion,
                chainId: await getMemoizedChainId()
            })

            if (isKernelV2(kernelVersion)) {
                return signature
            }

            return concatHex([
                getEcdsaRootIdentifierForKernelV3(validatorAddress),
                signature
            ])
        },
        async signTypedData(typedData) {
            const signature = await signTypedData({
                owner: owner,
                chainId: await getMemoizedChainId(),
                ...(typedData as TypedDataDefinition),
                accountAddress: await this.getAddress(),
                kernelVersion
            })

            if (isKernelV2(kernelVersion)) {
                return signature
            }

            return concatHex([
                getEcdsaRootIdentifierForKernelV3(validatorAddress),
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
                      kernelVersion
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
    }) as Promise<ToKernelSmartAccountReturnType<entryPointVersion>>
}
