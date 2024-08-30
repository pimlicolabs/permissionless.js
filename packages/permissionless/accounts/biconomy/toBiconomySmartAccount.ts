import type {
    Account,
    Assign,
    Chain,
    EIP1193Provider,
    OneOf,
    Prettify,
    Transport,
    WalletClient
} from "viem"
import {
    type Address,
    type Client,
    type Hex,
    type LocalAccount,
    encodeAbiParameters,
    encodeFunctionData,
    parseAbiParameters
} from "viem"
import {
    type SmartAccount,
    type SmartAccountImplementation,
    entryPoint06Abi,
    entryPoint06Address,
    getUserOperationHash,
    toSmartAccount
} from "viem/account-abstraction"
import { signMessage } from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce"
import { getSenderAddress } from "../../actions/public/getSenderAddress"
import { toOwner } from "../../utils/toOwner"
import { BiconomyAbi, FactoryAbi } from "./abi/BiconomySmartAccountAbi"

/**
 * The account creation ABI for Biconomy Smart Account (from the biconomy SmartAccountFactory)
 */

/**
 * Default addresses for Biconomy Smart Account
 */
const BICONOMY_ADDRESSES: {
    ECDSA_OWNERSHIP_REGISTRY_MODULE: Address
    FACTORY_ADDRESS: Address
} = {
    ECDSA_OWNERSHIP_REGISTRY_MODULE:
        "0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e",
    FACTORY_ADDRESS: "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5"
}

/**
 * Get the account initialization code for Biconomy smart account with ECDSA as default authorization module
 * @param owner
 * @param index
 * @param factoryAddress
 * @param ecdsaValidatorAddress
 */
const getAccountInitCode = async ({
    owner,
    index,
    ecdsaModuleAddress
}: {
    owner: Address
    index: bigint
    ecdsaModuleAddress: Address
}): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")

    // Build the module setup data
    const ecdsaOwnershipInitData = encodeFunctionData({
        abi: BiconomyAbi,
        functionName: "initForSmartAccount",
        args: [owner]
    })

    // Build the account init code
    return encodeFunctionData({
        abi: FactoryAbi,
        functionName: "deployCounterFactualAccount",
        args: [ecdsaModuleAddress, ecdsaOwnershipInitData, index]
    })
}

export type ToBiconomySmartAccountParameters = Prettify<{
    client: Client
    owner: OneOf<
        | EIP1193Provider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >
    address?: Address | undefined
    entryPoint?: {
        address: Address
        version: "0.6"
    }
    nonceKey?: bigint
    index?: bigint
    factoryAddress?: Address
    ecdsaModuleAddress?: Address
}>

export type BiconomySmartAccountImplementation = Assign<
    SmartAccountImplementation<typeof entryPoint06Abi, "0.6">,
    { sign: NonNullable<SmartAccountImplementation["sign"]> }
>

export type ToBiconomySmartAccountReturnType = Prettify<
    SmartAccount<BiconomySmartAccountImplementation>
>

/**
 * Build a Biconomy modular smart account from a private key, that use the ECDSA signer behind the scene
 * @param client
 * @param privateKey
 * @param entryPoint
 * @param index
 * @param factoryAddress
 * @param ecdsaModuleAddress
 */

export async function toBiconomySmartAccount(
    parameters: ToBiconomySmartAccountParameters
): Promise<ToBiconomySmartAccountReturnType> {
    const { owner, client, index = 0n, address } = parameters

    const localOwner = await toOwner({ owner })

    const entryPoint = {
        address: parameters.entryPoint?.address ?? entryPoint06Address,
        abi: entryPoint06Abi,
        version: parameters.entryPoint?.version ?? "0.6"
    }

    const factoryAddress =
        parameters.factoryAddress ?? BICONOMY_ADDRESSES.FACTORY_ADDRESS

    let accountAddress: Address | undefined = address

    const ecdsaModuleAddress =
        parameters.ecdsaModuleAddress ??
        BICONOMY_ADDRESSES.ECDSA_OWNERSHIP_REGISTRY_MODULE

    const getFactoryArgs = async () => {
        return {
            factory: factoryAddress,
            factoryData: await getAccountInitCode({
                owner: localOwner.address,
                index,
                ecdsaModuleAddress
            })
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
        async getNonce(args) {
            const address = await this.getAddress()
            return getAccountNonce(client, {
                address,
                entryPointAddress: entryPoint.address,
                key: args?.key ?? parameters?.nonceKey
            })
        },
        encodeCalls: async (calls) => {
            if (calls.length > 1) {
                // Encode a batched call
                return encodeFunctionData({
                    abi: BiconomyAbi,
                    functionName: "executeBatch_y6U",
                    args: [
                        calls.map((a) => a.to),
                        calls.map((a) => a.value ?? 0n),
                        calls.map((a) => a.data ?? "0x")
                    ]
                })
            }
            const { to, value, data } = calls[0]
            // Encode a simple call
            return encodeFunctionData({
                abi: BiconomyAbi,
                functionName: "execute_ncC",
                args: [to, value ?? 0n, data ?? "0x"]
            })
        },
        // Get simple dummy signature for ECDSA module authorization
        async getStubSignature() {
            const dynamicPart = ecdsaModuleAddress.substring(2).padEnd(40, "0")
            return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        async signMessage({ message }) {
            let signature = await localOwner.signMessage({
                message
            })

            const potentiallyIncorrectV = Number.parseInt(
                signature.slice(-2),
                16
            )
            if (![27, 28].includes(potentiallyIncorrectV)) {
                const correctV = potentiallyIncorrectV + 27
                signature = (signature.slice(0, -2) +
                    correctV.toString(16)) as Hex
            }
            return encodeAbiParameters(
                [{ type: "bytes" }, { type: "address" }],
                [signature, ecdsaModuleAddress]
            )
        },
        async signTypedData(typedData) {
            let signature = await localOwner.signTypedData(typedData)

            const potentiallyIncorrectV = Number.parseInt(
                signature.slice(-2),
                16
            )
            if (![27, 28].includes(potentiallyIncorrectV)) {
                const correctV = potentiallyIncorrectV + 27
                signature = (signature.slice(0, -2) +
                    correctV.toString(16)) as Hex
            }
            return encodeAbiParameters(
                [{ type: "bytes" }, { type: "address" }],
                [signature, ecdsaModuleAddress]
            )
        },
        // Sign a user operation
        async signUserOperation(parameters) {
            const { chainId = client.chain?.id, ...userOperation } = parameters

            if (!chainId) throw new Error("Chain id not found")

            const hash = getUserOperationHash({
                userOperation: {
                    ...userOperation,
                    sender: userOperation.sender ?? (await this.getAddress()),
                    signature: "0x"
                },
                entryPointAddress: entryPoint.address,
                entryPointVersion: entryPoint.version,
                chainId: chainId
            })
            const signature = await signMessage(client, {
                account: localOwner,
                message: { raw: hash }
            })
            // userOp signature is encoded module signature + module address
            const signatureWithModuleAddress = encodeAbiParameters(
                parseAbiParameters("bytes, address"),
                [signature, ecdsaModuleAddress]
            )
            return signatureWithModuleAddress
        }
    })
}
