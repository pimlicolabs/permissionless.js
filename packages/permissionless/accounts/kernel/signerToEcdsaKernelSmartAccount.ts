import type { Account, TypedData } from "viem"
import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type LocalAccount,
    type Transport,
    type TypedDataDefinition,
    concatHex,
    encodeFunctionData,
    toHex,
    zeroAddress
} from "viem"
import { signMessage as _signMessage, getChainId } from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce"
import { getSenderAddress } from "../../actions/public/getSenderAddress"
import type {
    ENTRYPOINT_ADDRESS_V07_TYPE,
    EntryPoint,
    Prettify
} from "../../types"
import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06, getEntryPointVersion } from "../../utils"
import { getUserOperationHash } from "../../utils/getUserOperationHash"
import { isSmartAccountDeployed } from "../../utils/isSmartAccountDeployed"
import { toSmartAccount } from "../toSmartAccount"
import type { SmartAccount } from "../types"
import {
    SignTransactionNotSupportedBySmartAccount,
    type SmartAccountSigner
} from "../types"
import { KernelInitAbi } from "./abi/KernelAccountAbi"
import { KernelV3InitAbi, KernelV3_1AccountAbi } from "./abi/KernelV3AccountAbi"
import { KernelV3MetaFactoryDeployWithFactoryAbi } from "./abi/KernelV3MetaFactoryAbi"
import {
    DUMMY_ECDSA_SIGNATURE,
    ROOT_MODE_KERNEL_V2,
    VALIDATOR_TYPE
} from "./constants"
import { encodeCallData } from "./utils/encodeCallData"
import { getNonceKeyWithEncoding } from "./utils/getNonceKey"
import { isKernelV2 } from "./utils/isKernelV2"
import { signMessage } from "./utils/signMessage"
import { signTypedData } from "./utils/signTypedData"

export type KernelEcdsaSmartAccount<
    entryPoint extends EntryPoint,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<entryPoint, "kernelEcdsaSmartAccount", transport, chain>

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

export type KernelVersion<entryPoint extends EntryPoint> =
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE
        ? "0.2.1" | "0.2.2" | "0.2.3" | "0.2.4"
        : "0.3.0-beta" | "0.3.1"

/**
 * Default addresses map for different kernel smart account versions
 */
export const KERNEL_VERSION_TO_ADDRESSES_MAP: {
    [key in KernelVersion<EntryPoint>]: {
        ECDSA_VALIDATOR: Address
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
        META_FACTORY_ADDRESS: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5"
    },
    "0.3.1": {
        ECDSA_VALIDATOR: "0x845ADb2C711129d4f3966735eD98a9F09fC4cE57",
        ACCOUNT_LOGIC: "0xBAC849bB641841b44E965fB01A4Bf5F074f84b4D",
        FACTORY_ADDRESS: "0xaac5D4240AF87249B3f71BC8E4A2cae074A3E419",
        META_FACTORY_ADDRESS: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5"
    }
}

/**
 * Get supported Kernel Smart Account version based on entryPoint
 * @param entryPoint
 */
const getDefaultKernelVersion = <TEntryPoint extends EntryPoint>(
    entryPoint: TEntryPoint,
    version?: KernelVersion<TEntryPoint>
): KernelVersion<TEntryPoint> => {
    if (version) {
        return version
    }
    return (
        entryPoint === ENTRYPOINT_ADDRESS_V06 ? "0.2.2" : "0.3.0-beta"
    ) as KernelVersion<TEntryPoint>
}

type KERNEL_ADDRESSES = {
    ecdsaValidatorAddress: Address
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
    ecdsaValidatorAddress: _ecdsaValidatorAddress,
    accountLogicAddress: _accountLogicAddress,
    factoryAddress: _factoryAddress,
    metaFactoryAddress: _metaFactoryAddress,
    kernelVersion
}: Partial<KERNEL_ADDRESSES> & {
    kernelVersion: KernelVersion<EntryPoint>
}): KERNEL_ADDRESSES => {
    const addresses = KERNEL_VERSION_TO_ADDRESSES_MAP[kernelVersion]
    const ecdsaValidatorAddress =
        _ecdsaValidatorAddress ?? addresses.ECDSA_VALIDATOR
    const accountLogicAddress = _accountLogicAddress ?? addresses.ACCOUNT_LOGIC
    const factoryAddress = _factoryAddress ?? addresses.FACTORY_ADDRESS
    const metaFactoryAddress =
        _metaFactoryAddress ?? addresses?.META_FACTORY_ADDRESS ?? zeroAddress // Meta Factory doesn't exists for Kernel v2.2

    return {
        ecdsaValidatorAddress,
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
const getInitialisationData = <entryPoint extends EntryPoint>({
    kernelVersion,
    entryPoint: entryPointAddress,
    owner,
    ecdsaValidatorAddress
}: {
    kernelVersion: KernelVersion<entryPoint>
    entryPoint: entryPoint
    owner: Address
    ecdsaValidatorAddress: Address
}) => {
    const entryPointVersion = getEntryPointVersion(entryPointAddress)

    if (entryPointVersion === "v0.6") {
        return encodeFunctionData({
            abi: KernelInitAbi,
            functionName: "initialize",
            args: [ecdsaValidatorAddress, owner]
        })
    }

    if (kernelVersion === "0.3.0-beta") {
        return encodeFunctionData({
            abi: KernelV3InitAbi,
            functionName: "initialize",
            args: [
                getEcdsaRootIdentifierForKernelV3(ecdsaValidatorAddress),
                zeroAddress,
                owner,
                "0x"
            ]
        })
    }

    return encodeFunctionData({
        abi: KernelV3_1AccountAbi,
        functionName: "initialize",
        args: [
            getEcdsaRootIdentifierForKernelV3(ecdsaValidatorAddress),
            zeroAddress,
            owner,
            "0x",
            []
        ]
    })
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
const getAccountInitCode = async <entryPoint extends EntryPoint>({
    entryPoint: entryPointAddress,
    kernelVersion,
    owner,
    index,
    factoryAddress,
    accountLogicAddress,
    ecdsaValidatorAddress
}: {
    kernelVersion: KernelVersion<entryPoint>
    entryPoint: entryPoint
    owner: Address
    index: bigint
    factoryAddress: Address
    accountLogicAddress: Address
    ecdsaValidatorAddress: Address
}): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")
    const entryPointVersion = getEntryPointVersion(entryPointAddress)

    // Build the account initialization data
    const initialisationData = getInitialisationData({
        kernelVersion,
        entryPoint: entryPointAddress,
        ecdsaValidatorAddress,
        owner
    })

    // Build the account init code

    if (entryPointVersion === "v0.6") {
        return encodeFunctionData({
            abi: createAccountAbi,
            functionName: "createAccount",
            args: [accountLogicAddress, initialisationData, index]
        })
    }

    return encodeFunctionData({
        abi: KernelV3MetaFactoryDeployWithFactoryAbi,
        functionName: "deployWithFactory",
        args: [factoryAddress, initialisationData, toHex(index, { size: 32 })]
    })
}

/**
 * Check the validity of an existing account address, or fetch the pre-deterministic account address for a kernel smart wallet
 * @param client
 * @param owner
 * @param entryPoint
 * @param ecdsaValidatorAddress
 * @param initCodeProvider
 * @param factoryAddress
 */
const getAccountAddress = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TClientAccount extends Account | undefined = undefined
>({
    client,
    entryPoint: entryPointAddress,
    factory,
    factoryData
}: {
    client: Client<TTransport, TChain, TClientAccount>
    entryPoint: entryPoint
    factory: Address
    factoryData: Hex
}): Promise<Address> => {
    // Find the init code for this account
    const entryPointVersion = getEntryPointVersion(entryPointAddress)
    if (entryPointVersion === "v0.6") {
        return getSenderAddress<ENTRYPOINT_ADDRESS_V06_TYPE>(client, {
            initCode: concatHex([factory, factoryData]),
            entryPoint: entryPointAddress as ENTRYPOINT_ADDRESS_V06_TYPE
        })
    }
    return getSenderAddress<ENTRYPOINT_ADDRESS_V07_TYPE>(client, {
        factory: factory,
        factoryData: factoryData,
        entryPoint: entryPointAddress as ENTRYPOINT_ADDRESS_V07_TYPE
    })
}

export type SignerToEcdsaKernelSmartAccountParameters<
    entryPoint extends EntryPoint,
    TSource extends string = string,
    TAddress extends Address = Address
> = Prettify<{
    signer: SmartAccountSigner<TSource, TAddress>
    version?: KernelVersion<entryPoint>
    entryPoint: entryPoint
    address?: Address
    index?: bigint
    factoryAddress?: Address
    metaFactoryAddress?: Address
    accountLogicAddress?: Address
    ecdsaValidatorAddress?: Address
    nonceKey?: bigint
}>
/**
 * Build a kernel smart account from a private key, that use the ECDSA signer behind the scene
 * @param client
 * @param privateKey
 * @param entryPoint
 * @param index
 * @param factoryAddress
 * @param accountLogicAddress
 * @param ecdsaValidatorAddress
 */
export async function signerToEcdsaKernelSmartAccount<
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TClientAccount extends Account | undefined = undefined,
    TSource extends string = string,
    TAddress extends Address = Address
>(
    client: Client<TTransport, TChain, TClientAccount>,
    {
        signer,
        address,
        version,
        entryPoint: entryPointAddress,
        index = BigInt(0),
        factoryAddress: _factoryAddress,
        metaFactoryAddress: _metaFactoryAddress,
        accountLogicAddress: _accountLogicAddress,
        ecdsaValidatorAddress: _ecdsaValidatorAddress,
        nonceKey
    }: SignerToEcdsaKernelSmartAccountParameters<entryPoint, TSource, TAddress>
): Promise<KernelEcdsaSmartAccount<entryPoint, TTransport, TChain>> {
    const entryPointVersion = getEntryPointVersion(entryPointAddress)
    const kernelVersion = getDefaultKernelVersion(entryPointAddress, version)

    const {
        accountLogicAddress,
        ecdsaValidatorAddress,
        factoryAddress,
        metaFactoryAddress
    } = getDefaultAddresses({
        ecdsaValidatorAddress: _ecdsaValidatorAddress,
        accountLogicAddress: _accountLogicAddress,
        factoryAddress: _factoryAddress,
        metaFactoryAddress: _metaFactoryAddress,
        kernelVersion
    })

    // Get the private key related account
    const viemSigner: LocalAccount = {
        ...signer,
        signTransaction: (_, __) => {
            throw new SignTransactionNotSupportedBySmartAccount()
        }
    } as LocalAccount

    // Helper to generate the init code for the smart account
    const generateInitCode = () =>
        getAccountInitCode({
            kernelVersion,
            entryPoint: entryPointAddress,
            owner: viemSigner.address,
            index,
            factoryAddress,
            accountLogicAddress,
            ecdsaValidatorAddress
        })

    // Fetch account address and chain id
    const [accountAddress, chainId] = await Promise.all([
        address ??
            getAccountAddress({
                client,
                factory:
                    entryPointVersion === "v0.6"
                        ? factoryAddress
                        : metaFactoryAddress,
                factoryData: await generateInitCode(),
                entryPoint: entryPointAddress
            }),
        client.chain?.id ?? getChainId(client)
    ])

    if (!accountAddress) throw new Error("Account address not found")

    let smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
    )

    return toSmartAccount({
        address: accountAddress,
        async signMessage({ message }) {
            const signature = await signMessage(client, {
                account: viemSigner,
                message,
                accountAddress,
                accountVersion: kernelVersion,
                chainId
            })

            if (isKernelV2(kernelVersion)) {
                return signature
            }

            return concatHex([
                getEcdsaRootIdentifierForKernelV3(ecdsaValidatorAddress),
                signature
            ])
        },
        async signTransaction(_, __) {
            throw new SignTransactionNotSupportedBySmartAccount()
        },
        async signTypedData<
            const TTypedData extends TypedData | Record<string, unknown>,
            TPrimaryType extends
                | keyof TTypedData
                | "EIP712Domain" = keyof TTypedData
        >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
            const signature = await signTypedData<
                TTypedData,
                TPrimaryType,
                TChain,
                TClientAccount
            >(client, {
                account: viemSigner,
                ...typedData,
                accountAddress,
                accountVersion: kernelVersion,
                chainId
            })

            if (isKernelV2(kernelVersion)) {
                return signature
            }

            return concatHex([
                getEcdsaRootIdentifierForKernelV3(ecdsaValidatorAddress),
                signature
            ])
        },
        client: client,
        publicKey: accountAddress,
        entryPoint: entryPointAddress,
        source: "kernelEcdsaSmartAccount",

        // Get the nonce of the smart account
        async getNonce(key?: bigint) {
            return getAccountNonce(client, {
                sender: accountAddress,
                entryPoint: entryPointAddress,
                key:
                    key ??
                    nonceKey ??
                    getNonceKeyWithEncoding(
                        kernelVersion,
                        ecdsaValidatorAddress
                        // @dev specify the custom nonceKey here when integrating the said feature
                        /*, nonceKey */
                    )
            })
        },

        // Sign a user operation
        async signUserOperation(userOperation) {
            const hash = getUserOperationHash({
                userOperation: {
                    ...userOperation,
                    signature: "0x"
                },
                entryPoint: entryPointAddress,
                chainId: chainId
            })
            const signature = await _signMessage(client, {
                account: viemSigner,
                message: { raw: hash }
            })
            // Always use the sudo mode, since we will use external paymaster
            if (isKernelV2(kernelVersion)) {
                return concatHex(["0x00000000", signature])
            }
            return signature
        },

        // Encode the init code
        async getInitCode() {
            if (smartAccountDeployed) return "0x"

            smartAccountDeployed = await isSmartAccountDeployed(
                client,
                accountAddress
            )

            if (smartAccountDeployed) return "0x"

            const _factoryAddress =
                entryPointVersion === "v0.6"
                    ? factoryAddress
                    : metaFactoryAddress
            return concatHex([_factoryAddress, await generateInitCode()])
        },

        async getFactory() {
            if (smartAccountDeployed) return undefined

            smartAccountDeployed = await isSmartAccountDeployed(
                client,
                accountAddress
            )

            if (smartAccountDeployed) return undefined

            return entryPointVersion === "v0.6"
                ? factoryAddress
                : metaFactoryAddress
        },

        async getFactoryData() {
            if (smartAccountDeployed) return undefined

            smartAccountDeployed = await isSmartAccountDeployed(
                client,
                accountAddress
            )

            if (smartAccountDeployed) return undefined

            return generateInitCode()
        },

        // Encode the deploy call data
        async encodeDeployCallData(_) {
            throw new Error("Simple account doesn't support account deployment")
        },

        // Encode a call
        async encodeCallData(_tx) {
            return encodeCallData(_tx, kernelVersion)
        },

        // Get simple dummy signature
        async getDummySignature(_userOperation) {
            if (isKernelV2(kernelVersion)) {
                return concatHex([ROOT_MODE_KERNEL_V2, DUMMY_ECDSA_SIGNATURE])
            }
            return DUMMY_ECDSA_SIGNATURE
        }
    })
}
