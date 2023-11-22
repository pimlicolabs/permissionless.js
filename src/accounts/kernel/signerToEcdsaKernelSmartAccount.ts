import {
    type Address,
    BaseError,
    type Chain,
    type Client,
    type Hex,
    type Transport,
    concatHex,
    encodeFunctionData
} from "viem"
import { privateKeyToAccount, toAccount } from "viem/accounts"
import { getBytecode, getChainId } from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"
import { getSenderAddress } from "../../actions/public/getSenderAddress.js"
import { getUserOperationHash } from "../../utils/getUserOperationHash.js"
import type { SmartAccount } from "../types.js"
import { KernelAccountAbi } from "./abi/KernelAccountAbi.js"

export class SignTransactionNotSupportedByKernelSmartAccount extends BaseError {
    override name = "SignTransactionNotSupportedByKernelSmartAccount"
    constructor({ docsPath }: { docsPath?: string } = {}) {
        super(
            [
                "A smart account cannot sign or send transaction, it can only sign message or userOperation.",
                "Please send user operation instead."
            ].join("\n"),
            {
                docsPath,
                docsSlug: "account"
            }
        )
    }
}

export type KernelEcdsaSmartAccount<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<"kernelEcdsaSmartAccount", transport, chain>

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

/**
 * Address of the ECDSA Validator
 */
const ECDSA_VALIDATOR = "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390"

/**
 * Address of the current deployed kernel smart account
 */
const KERNEL_ACCOUNT_2_2_ADDRESS = "0x0DA6a956B9488eD4dd761E59f52FDc6c8068E6B5"

/**
 * Address for the kernel smart ccount factory
 */
const KERNEL_FACTORY_ADDRESS = "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3"

/**
 * Get the account initialization code for a kernel smart account
 * @param owner
 * @param index
 * @param factoryAddress
 * @param accountLogicAddress
 * @param ecdsaValidatorAddress
 */
const getAccountInitCode = async ({
    owner,
    index,
    factoryAddress,
    accountLogicAddress,
    ecdsaValidatorAddress
}: {
    owner: Address
    index: bigint
    factoryAddress: Address
    accountLogicAddress: Address
    ecdsaValidatorAddress: Address
}): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")

    // Build the account initialization data
    const initialisationData = encodeFunctionData({
        abi: KernelAccountAbi,
        functionName: "initialize",
        args: [ecdsaValidatorAddress, owner]
    })

    // Build the account init code
    return concatHex([
        factoryAddress,
        encodeFunctionData({
            abi: createAccountAbi,
            functionName: "createAccount",
            args: [accountLogicAddress, initialisationData, index]
        }) as Hex
    ])
}

/**
 * Get a pre-deterministic account address for a kernel smart wallet
 * @param client
 * @param entryPoint
 * @param owner
 * @param index
 * @param factoryAddress
 * @param accountLogicAddress
 * @param ecdsaValidatorAddress
 */
const getAccountAddress = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>({
    client,
    entryPoint,
    owner,
    index = 0n,
    factoryAddress,
    accountLogicAddress,
    ecdsaValidatorAddress
}: {
    client: Client<TTransport, TChain>
    owner: Address
    entryPoint: Address
    index?: bigint
    factoryAddress: Address
    accountLogicAddress: Address
    ecdsaValidatorAddress: Address
}): Promise<Address> => {
    // Find the init code for this account
    const initCode = await getAccountInitCode({
        owner,
        index,
        factoryAddress,
        accountLogicAddress,
        ecdsaValidatorAddress
    })

    // Get the sender address based on the init code
    return getSenderAddress(client, {
        initCode,
        entryPoint
    })
}

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
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain>,
    {
        privateKey,
        entryPoint,
        index = 0n,
        factoryAddress = KERNEL_FACTORY_ADDRESS,
        accountLogicAddress = KERNEL_ACCOUNT_2_2_ADDRESS,
        ecdsaValidatorAddress = ECDSA_VALIDATOR
    }: {
        privateKey: Hex
        entryPoint: Address
        index?: bigint
        factoryAddress?: Address
        accountLogicAddress?: Address
        ecdsaValidatorAddress?: Address
    }
): Promise<KernelEcdsaSmartAccount<TTransport, TChain>> {
    // Get the private key related account
    const privateKeyAccount = privateKeyToAccount(privateKey)

    // Fetch account address and chain id
    const [accountAddress, chainId] = await Promise.all([
        getAccountAddress<TTransport, TChain>({
            client,
            entryPoint,
            owner: privateKeyAccount.address,
            index,
            factoryAddress,
            accountLogicAddress,
            ecdsaValidatorAddress
        }),
        getChainId(client)
    ])

    if (!accountAddress) throw new Error("Account address not found")

    // Build the EOA Signer
    const account = toAccount({
        address: accountAddress,
        async signMessage({ message }) {
            return privateKeyAccount.signMessage({ message })
        },
        async signTransaction(_, __) {
            throw new SignTransactionNotSupportedByKernelSmartAccount()
        },
        async signTypedData(typedData) {
            return privateKeyAccount.signTypedData({ ...typedData, privateKey })
        }
    })

    return {
        ...account,
        client: client,
        publicKey: accountAddress,
        entryPoint: entryPoint,
        source: "kernelEcdsaSmartAccount",

        // Get the nonce of the smart account
        async getNonce() {
            return getAccountNonce(client, {
                sender: accountAddress,
                entryPoint: entryPoint
            })
        },

        // Sign a user operation
        async signUserOperation(userOperation) {
            const hash = getUserOperationHash({
                userOperation: {
                    ...userOperation,
                    signature: "0x"
                },
                entryPoint: entryPoint,
                chainId: chainId
            })
            console.log("Hash: ", hash)
            const signature = await privateKeyAccount.signMessage({
                message: { raw: hash }
            })
            // Always use the sudo mode, since we will use external paymaster
            return concatHex(["0x00000000", signature])
        },

        // Encode the init code
        async getInitCode() {
            const contractCode = await getBytecode(client, {
                address: accountAddress
            })

            if ((contractCode?.length ?? 0) > 2) return "0x"

            return getAccountInitCode({
                owner: privateKeyAccount.address,
                index,
                factoryAddress,
                accountLogicAddress,
                ecdsaValidatorAddress
            })
        },

        // Encode the deploy call data
        async encodeDeployCallData(_) {
            throw new Error("Simple account doesn't support account deployment")
        },

        // Encode a call
        async encodeCallData(_tx) {
            if (Array.isArray(_tx)) {
                // Encode a batched call
                return encodeFunctionData({
                    abi: KernelAccountAbi,
                    functionName: "executeBatch",
                    args: [
                        _tx.map((tx) => ({
                            to: tx.to,
                            value: tx.value,
                            data: tx.data
                        }))
                    ]
                })
            } else {
                // Encode a simple call
                return encodeFunctionData({
                    abi: KernelAccountAbi,
                    functionName: "execute",
                    args: [_tx.to, _tx.value, _tx.data, 0]
                })
            }
        },

        // Get simple dummy signature
        async getDummySignature() {
            return "0x00000000fffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
        }
    }
}
