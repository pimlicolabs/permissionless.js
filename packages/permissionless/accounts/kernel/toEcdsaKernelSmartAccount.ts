import type { Assign } from "viem"
import {
    type Address,
    type Client,
    type Hex,
    type LocalAccount,
    type TypedDataDefinition,
    concatHex,
    encodeFunctionData,
    toHex,
    zeroAddress
} from "viem"
import {
    type SmartAccount,
    type SmartAccountImplementation,
    type UserOperation,
    entryPoint06Abi,
    type entryPoint06Address,
    entryPoint07Abi,
    entryPoint07Address,
    getUserOperationHash,
    toSmartAccount
} from "viem/account-abstraction"
import { signMessage as _signMessage, getChainId } from "viem/actions"
import { getAction } from "viem/utils"
import { getAccountNonce } from "../../actions/public/getAccountNonce"
import { getSenderAddress } from "../../actions/public/getSenderAddress"
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
    kernelVersion: KernelVersion<"0.6" | "0.7">
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
const getInitializationData = <entryPointVersion extends "0.6" | "0.7">({
    entryPoint: { version: entryPointVersion },
    kernelVersion,
    owner,
    ecdsaValidatorAddress
}: {
    kernelVersion: KernelVersion<entryPointVersion>
    entryPoint: {
        version: entryPointVersion
    }
    owner: Address
    ecdsaValidatorAddress: Address
}) => {
    if (entryPointVersion === "0.6") {
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
const getAccountInitCode = async <entryPointVersion extends "0.6" | "0.7">({
    entryPointVersion,
    kernelVersion,
    owner,
    index,
    factoryAddress,
    accountLogicAddress,
    ecdsaValidatorAddress
}: {
    kernelVersion: KernelVersion<entryPointVersion>
    entryPointVersion: entryPointVersion
    owner: Address
    index: bigint
    factoryAddress: Address
    accountLogicAddress: Address
    ecdsaValidatorAddress: Address
}): Promise<Hex> => {
    // Build the account initialization data
    const initializationData = getInitializationData({
        entryPoint: { version: entryPointVersion },
        kernelVersion,
        ecdsaValidatorAddress,
        owner
    })

    // Build the account init code

    if (entryPointVersion === "0.6") {
        return encodeFunctionData({
            abi: createAccountAbi,
            functionName: "createAccount",
            args: [accountLogicAddress, initializationData, index]
        })
    }

    return encodeFunctionData({
        abi: KernelV3MetaFactoryDeployWithFactoryAbi,
        functionName: "deployWithFactory",
        args: [factoryAddress, initializationData, toHex(index, { size: 32 })]
    })
}

export type ToEcdsaKernelSmartAccountParameters<
    entryPointVersion extends "0.6" | "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>
> = {
    client: Client
    owner: LocalAccount
    entryPoint?: {
        address: typeof entryPoint06Address | typeof entryPoint07Address
        version: entryPointVersion
    }
    address?: Address
    version?: kernelVersion
    index?: bigint
    factoryAddress?: Address
    metaFactoryAddress?: Address
    accountLogicAddress?: Address
    ecdsaValidatorAddress?: Address
    nonceKey?: bigint
}

export type EcdsaKernelSmartAccountImplementation<
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

export type ToEcdsaKernelSmartAccountReturnType<
    entryPointVersion extends "0.6" | "0.7" = "0.7"
> = SmartAccount<EcdsaKernelSmartAccountImplementation<entryPointVersion>>
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
export async function toEcdsaKernelSmartAccount<
    entryPointVersion extends "0.6" | "0.7",
    kernelVersion extends KernelVersion<entryPointVersion>
>(
    parameters: ToEcdsaKernelSmartAccountParameters<
        entryPointVersion,
        kernelVersion
    >
): Promise<ToEcdsaKernelSmartAccountReturnType<entryPointVersion>> {
    const {
        client,
        address,
        index = 0n,
        owner,
        version,
        ecdsaValidatorAddress: _ecdsaValidatorAddress,
        factoryAddress: _factoryAddress,
        metaFactoryAddress: _metaFactoryAddress,
        accountLogicAddress: _accountLogicAddress
    } = parameters

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

    // Helper to generate the init code for the smart account
    const generateInitCode = () =>
        getAccountInitCode({
            entryPointVersion: entryPoint.version,
            kernelVersion,
            owner: owner.address,
            index,
            factoryAddress,
            accountLogicAddress,
            ecdsaValidatorAddress
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
                entryPoint.version === "0.6"
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
        async getNonce(_args) {
            return getAccountNonce(client, {
                address: await this.getAddress(),
                entryPointAddress: entryPoint.address,
                key: getNonceKeyWithEncoding(
                    kernelVersion,
                    ecdsaValidatorAddress,
                    /*args?.key ?? */ parameters.nonceKey ?? 0n
                )
            })
        },
        async getStubSignature() {
            if (isKernelV2(kernelVersion)) {
                return concatHex([ROOT_MODE_KERNEL_V2, DUMMY_ECDSA_SIGNATURE])
            }
            return DUMMY_ECDSA_SIGNATURE
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        async signMessage({ message }) {
            const signature = await signMessage({
                owner: owner,
                message,
                accountAddress: await this.getAddress(),
                kernelVersion,
                chainId: await getMemoizedChainId()
            })

            if (isKernelV2(kernelVersion)) {
                return signature
            }

            return concatHex([
                getEcdsaRootIdentifierForKernelV3(ecdsaValidatorAddress),
                signature
            ])
        },
        async signTypedData(typedData) {
            const signature = await signTypedData({
                owner,
                chainId: await getMemoizedChainId(),
                ...(typedData as TypedDataDefinition),
                accountAddress: await this.getAddress(),
                kernelVersion
            })

            if (isKernelV2(kernelVersion)) {
                return signature
            }

            return concatHex([
                getEcdsaRootIdentifierForKernelV3(ecdsaValidatorAddress),
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
            const signature = await owner.signMessage({
                message: { raw: hash }
            })

            // Always use the sudo mode, since we will use external paymaster
            if (isKernelV2(kernelVersion)) {
                return concatHex(["0x00000000", signature])
            }
            return signature
        }
    }) as Promise<ToEcdsaKernelSmartAccountReturnType<entryPointVersion>>
}
