import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type LocalAccount,
    type Transport,
    type TypedData,
    type TypedDataDefinition,
    concatHex,
    encodeAbiParameters,
    encodeFunctionData,
    toHex,
    zeroAddress
} from "viem"
import {
    getChainId,
    readContract,
    signMessage as _signMessage
} from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce"
import type { ENTRYPOINT_ADDRESS_V07_TYPE, Prettify } from "../../types"
import { getEntryPointVersion } from "../../utils"
import { getUserOperationHash } from "../../utils/getUserOperationHash"
import { isSmartAccountDeployed } from "../../utils/isSmartAccountDeployed"
import { toSmartAccount } from "../toSmartAccount"
import type { SmartAccount } from "../types"
import {
    SignTransactionNotSupportedBySmartAccount,
    type SmartAccountSigner
} from "../types"
import { EtherspotWalletFactoryAbi } from "./abi/EtherspotWalletFactoryAbi"
import {
    DUMMY_ECDSA_SIGNATURE,
    Networks,
    VALIDATOR_TYPE,
    supportedNetworks
} from "./constants"
import { encodeCallData } from "./utils/encodeCallData"
import { getInitMSAData } from "./utils/getInitMSAData"
import { getNonceKeyWithEncoding } from "./utils/getNonceKey"
import { signMessage } from "./utils/signMessage"
import { signTypedData } from "./utils/signTypedData"

export type EtherspotSmartAccount<
    entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<entryPoint, "etherspotSmartAccount", transport, chain>

/**
 * The account creation ABI for a modular etherspot smart account
 */
const createAccountAbi = [
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "salt",
                type: "bytes32"
            },
            {
                internalType: "bytes",
                name: "initCode",
                type: "bytes"
            }
        ],
        name: "createAccount",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "payable",
        type: "function"
    }
] as const

type CONTRACT_ADDRESSES = {
    ecdsaValidatorAddress: Address
    metaFactoryAddress: Address
    bootstrapAddress: Address
    accountLogicAddress?: Address
    factoryAddress?: Address
}

/**
 * Get default addresses for Etherspot Smart Account based on chainId
 * @param chainId
 * @param ecdsaValidatorAddress
 * @param accountLogicAddress
 * @param factoryAddress
 * @param metaFactoryAddress
 */
const getDefaultAddresses = (
    chainId: number,
    {
        ecdsaValidatorAddress: _ecdsaValidatorAddress,
        accountLogicAddress: _accountLogicAddress,
        factoryAddress: _factoryAddress,
        metaFactoryAddress: _metaFactoryAddress
    }: Partial<CONTRACT_ADDRESSES>
): CONTRACT_ADDRESSES => {
    if (!supportedNetworks.includes(chainId)) {
        throw new Error(`Unsupported network with chainId: ${chainId}`)
    }

    const addresses = Networks[chainId]
    const ecdsaValidatorAddress =
        _ecdsaValidatorAddress ?? addresses.multipleOwnerECDSAValidator
    const metaFactoryAddress =
        _metaFactoryAddress ??
        addresses?.modularEtherspotWalletFactory ??
        zeroAddress
    const bootstrapAddress = addresses.bootstrap ?? zeroAddress

    return {
        ecdsaValidatorAddress,
        metaFactoryAddress,
        bootstrapAddress
    }
}

export const getEcdsaValidatorIdentifier = (validatorAddress: Address) => {
    return concatHex([VALIDATOR_TYPE.VALIDATOR, validatorAddress])
}

/**
 * Get the initialization data for a etherspot smart account
 * @param entryPoint
 * @param owner
 * @param ecdsaValidatorAddress
 */
const getInitialisationData = <entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE>({
    entryPoint: entryPointAddress,
    owner,
    ecdsaValidatorAddress,
    bootstrapAddress
}: {
    entryPoint: entryPoint
    owner: Address
    ecdsaValidatorAddress: Address
    bootstrapAddress: Address
}) => {
    const entryPointVersion = getEntryPointVersion(entryPointAddress)

    if (entryPointVersion === "v0.6") {
        throw new Error("Only EntryPoint 0.7 is supported")
    }

    const initMSAData = getInitMSAData(ecdsaValidatorAddress)

    const initCode = encodeAbiParameters(
        [{ type: "address" }, { type: "address" }, { type: "bytes" }],
        [owner, bootstrapAddress, initMSAData]
    )

    return initCode
}

/**
 * Get the account initialization code for a etherspot smart account
 * @param entryPoint
 * @param owner
 * @param index
 * @param factoryAddress
 * @param accountLogicAddress
 * @param ecdsaValidatorAddress
 */
const getAccountInitCode = async ({
    entryPoint: entryPointAddress,
    owner,
    index,
    ecdsaValidatorAddress,
    bootstrapAddress
}: {
    entryPoint: ENTRYPOINT_ADDRESS_V07_TYPE
    owner: Address
    index: bigint
    ecdsaValidatorAddress: Address
    bootstrapAddress: Address
}): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")

    // Build the account initialization data
    const initialisationData = getInitialisationData({
        entryPoint: entryPointAddress,
        ecdsaValidatorAddress,
        owner,
        bootstrapAddress
    })

    return encodeFunctionData({
        abi: createAccountAbi,
        functionName: "createAccount",
        args: [toHex(index, { size: 32 }), initialisationData]
    })
}

/**
 * Check the validity of an existing account address, or fetch the pre-deterministic account address for a etherspot smart wallet
 * @param client
 * @param owner
 * @param entryPoint
 * @param ecdsaValidatorAddress
 * @param initCodeProvider
 * @param deployedAccountAddress
 * @param factoryAddress
 */
const getAccountAddress = async <
    entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>({
    client,
    owner,
    entryPoint: entryPointAddress,
    ecdsaValidatorAddress,
    bootstrapAddress,
    factoryAddress,
    index
}: {
    client: Client<TTransport, TChain>
    owner: Address
    factoryAddress: Address
    entryPoint: entryPoint
    ecdsaValidatorAddress: Address
    bootstrapAddress: Address
    index: bigint
}): Promise<Address> => {
    const factoryData = getInitialisationData({
        entryPoint: entryPointAddress,
        ecdsaValidatorAddress,
        owner,
        bootstrapAddress
    })

    return await readContract(client, {
        address: factoryAddress,
        abi: EtherspotWalletFactoryAbi,
        functionName: "getAddress",
        args: [toHex(index, { size: 32 }), factoryData]
    })
}

export type SignerToEtherspotSmartAccountParameters<
    entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
    TSource extends string = string,
    TAddress extends Address = Address
> = Prettify<{
    signer: SmartAccountSigner<TSource, TAddress>
    entryPoint: entryPoint
    address?: Address
    index?: bigint
    factoryAddress?: Address
    metaFactoryAddress?: Address
    accountLogicAddress?: Address
    ecdsaValidatorAddress?: Address
    deployedAccountAddress?: Address
}>
/**
 * Build a etherspot smart account from a private key, that use the ECDSA signer behind the scene
 * @param client
 * @param privateKey
 * @param entryPoint
 * @param index
 * @param factoryAddress
 * @param accountLogicAddress
 * @param ecdsaValidatorAddress
 * @param deployedAccountAddress
 */
export async function signerToEtherspotSmartAccount<
    entryPoint extends ENTRYPOINT_ADDRESS_V07_TYPE,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address
>(
    client: Client<TTransport, TChain, undefined>,
    {
        signer,
        address,
        entryPoint: entryPointAddress,
        index = BigInt(0),
        factoryAddress: _factoryAddress,
        metaFactoryAddress: _metaFactoryAddress,
        accountLogicAddress: _accountLogicAddress,
        ecdsaValidatorAddress: _ecdsaValidatorAddress
    }: SignerToEtherspotSmartAccountParameters<entryPoint, TSource, TAddress>
): Promise<EtherspotSmartAccount<entryPoint, TTransport, TChain>> {
    const entryPointVersion = getEntryPointVersion(entryPointAddress)

    if (entryPointVersion === "v0.6") {
        throw new Error("Only EntryPoint 0.7 is supported")
    }

    const chainId = client.chain?.id ?? (await getChainId(client))
    const { ecdsaValidatorAddress, metaFactoryAddress, bootstrapAddress } =
        getDefaultAddresses(chainId, {
            ecdsaValidatorAddress: _ecdsaValidatorAddress,
            accountLogicAddress: _accountLogicAddress,
            factoryAddress: _factoryAddress,
            metaFactoryAddress: _metaFactoryAddress
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
            entryPoint: entryPointAddress,
            owner: viemSigner.address,
            index,
            ecdsaValidatorAddress,
            bootstrapAddress
        })

    // Fetch account address
    const accountAddress =
        address ??
        (await getAccountAddress<entryPoint, TTransport, TChain>({
            client,
            entryPoint: entryPointAddress,
            owner: viemSigner.address,
            ecdsaValidatorAddress,
            factoryAddress: metaFactoryAddress,
            bootstrapAddress,
            index
        }))

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
                chainId
            })

            return concatHex([
                getEcdsaValidatorIdentifier(ecdsaValidatorAddress),
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
                undefined
            >(
                client,
                {
                    account: viemSigner,
                    ...typedData,
                    accountAddress
                },
                chainId
            )

            return concatHex([
                getEcdsaValidatorIdentifier(ecdsaValidatorAddress),
                signature
            ])
        },
        client: client,
        publicKey: accountAddress,
        entryPoint: entryPointAddress,
        source: "etherspotSmartAccount",

        // Get the nonce of the smart account
        async getNonce() {
            const key = getNonceKeyWithEncoding(
                ecdsaValidatorAddress
                // @dev specify the custom nonceKey here when integrating the said feature
                /*, nonceKey */
            )
            return getAccountNonce(client, {
                sender: accountAddress,
                entryPoint: entryPointAddress,
                key
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

            const _factoryAddress = metaFactoryAddress
            return concatHex([_factoryAddress, await generateInitCode()])
        },

        async getFactory() {
            if (smartAccountDeployed) return undefined

            smartAccountDeployed = await isSmartAccountDeployed(
                client,
                accountAddress
            )

            if (smartAccountDeployed) return undefined

            return metaFactoryAddress
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
            throw new Error(
                "Etherspot smart account doesn't support account deployment"
            )
        },

        // Encode a call
        async encodeCallData(tx) {
            return encodeCallData(tx)
        },

        // Get simple dummy signature
        async getDummySignature(_userOperation) {
            return DUMMY_ECDSA_SIGNATURE
        }
    })
}
