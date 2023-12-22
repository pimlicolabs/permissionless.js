import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type LocalAccount,
    type Transport,
    concatHex,
    encodeAbiParameters,
    encodeFunctionData,
    encodePacked,
    getContractAddress,
    hexToBigInt,
    keccak256,
    parseAbiParameters
} from "viem"
import { toAccount } from "viem/accounts"
import {
    getBytecode,
    getChainId,
    signMessage,
    signTypedData
} from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"
import { getUserOperationHash } from "../../utils/getUserOperationHash.js"
import {
    SignTransactionNotSupportedBySmartAccount,
    type SmartAccount,
    type SmartAccountSigner
} from "../types.js"
import {
    BiconomyExecuteAbi,
    BiconomyInitAbi
} from "./abi/BiconomySmartAccountAbi.js"
// import Abis

export type BiconomySmartAccount<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<"biconomySmartAccount", transport, chain>

/**
 * The account creation ABI for Biconomy Smart Account (from the biconomy SmartAccountFactory)
 */

const createAccountAbi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "moduleSetupContract",
                type: "address"
            },
            {
                internalType: "bytes",
                name: "moduleSetupData",
                type: "bytes"
            },
            {
                internalType: "uint256",
                name: "index",
                type: "uint256"
            }
        ],
        name: "deployCounterFactualAccount",
        outputs: [
            {
                internalType: "address",
                name: "proxy",
                type: "address"
            }
        ],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const

/**
 * Default addresses for Biconomy Smart Account
 */
const BICONOMY_ADDRESSES: {
    ECDSA_OWNERSHIP_REGISTRY_MODULE: Address
    ACCOUNT_V2_0_LOGIC: Address
    FACTORY_ADDRESS: Address
    DEFAULT_FALLBACK_HANDLER_ADDRESS: Address
} = {
    ECDSA_OWNERSHIP_REGISTRY_MODULE:
        "0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e",
    ACCOUNT_V2_0_LOGIC: "0x0000002512019Dafb59528B82CB92D3c5D2423aC",
    FACTORY_ADDRESS: "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5",
    DEFAULT_FALLBACK_HANDLER_ADDRESS:
        "0x0bBa6d96BD616BedC6BFaa341742FD43c60b83C1"
}

const BICONOMY_PROXY_CREATION_CODE =
    "0x6080346100aa57601f61012038819003918201601f19168301916001600160401b038311848410176100af578084926020946040528339810103126100aa57516001600160a01b0381168082036100aa5715610065573055604051605a90816100c68239f35b60405162461bcd60e51b815260206004820152601e60248201527f496e76616c696420696d706c656d656e746174696f6e206164647265737300006044820152606490fd5b600080fd5b634e487b7160e01b600052604160045260246000fdfe608060405230546000808092368280378136915af43d82803e156020573d90f35b3d90fdfea2646970667358221220a03b18dce0be0b4c9afe58a9eb85c35205e2cf087da098bbf1d23945bf89496064736f6c63430008110033"

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
    factoryAddress,
    ecdsaModuleAddress
}: {
    owner: Address
    index: bigint
    factoryAddress: Address
    ecdsaModuleAddress: Address
}): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")

    // Build the module setup data
    const ecdsaOwnershipInitData = encodeFunctionData({
        abi: BiconomyInitAbi,
        functionName: "initForSmartAccount",
        args: [owner]
    })

    // Build the account init code
    return concatHex([
        factoryAddress,
        encodeFunctionData({
            abi: createAccountAbi,
            functionName: "deployCounterFactualAccount",
            args: [ecdsaModuleAddress, ecdsaOwnershipInitData, index]
        }) as Hex
    ])
}

const getAccountAddress = async ({
    factoryAddress,
    accountLogicAddress,
    fallbackHandlerAddress,
    ecdsaModuleAddress,
    owner,
    index = 0n
}: {
    factoryAddress: Address
    accountLogicAddress: Address
    fallbackHandlerAddress: Address
    ecdsaModuleAddress: Address
    owner: Address
    index?: bigint
}): Promise<Address> => {
    // Build the module setup data
    const ecdsaOwnershipInitData = encodeFunctionData({
        abi: BiconomyInitAbi,
        functionName: "initForSmartAccount",
        args: [owner]
    })

    // Build account init code
    const initialisationData = encodeFunctionData({
        abi: BiconomyInitAbi,
        functionName: "init",
        args: [
            fallbackHandlerAddress,
            ecdsaModuleAddress,
            ecdsaOwnershipInitData
        ]
    })

    const deploymentCode = encodePacked(
        ["bytes", "uint256"],
        [BICONOMY_PROXY_CREATION_CODE, hexToBigInt(accountLogicAddress)]
    )

    const salt = keccak256(
        encodePacked(
            ["bytes32", "uint256"],
            [keccak256(encodePacked(["bytes"], [initialisationData])), index]
        )
    )

    return getContractAddress({
        from: factoryAddress,
        salt,
        bytecode: deploymentCode,
        opcode: "CREATE2"
    })
}

/**
 * Build a Biconomy modular smart account from a private key, that use the ECDSA signer behind the scene
 * @param client
 * @param privateKey
 * @param entryPoint
 * @param index
 * @param factoryAddress
 * @param accountLogicAddress
 * @param ecdsaModuleAddress
 */
export async function signerToBiconomySmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = "custom",
    TAddress extends Address = Address
>(
    client: Client<TTransport, TChain>,
    {
        signer,
        entryPoint,
        index = 0n,
        factoryAddress = BICONOMY_ADDRESSES.FACTORY_ADDRESS,
        accountLogicAddress = BICONOMY_ADDRESSES.ACCOUNT_V2_0_LOGIC,
        fallbackHandlerAddress = BICONOMY_ADDRESSES.DEFAULT_FALLBACK_HANDLER_ADDRESS,
        ecdsaModuleAddress = BICONOMY_ADDRESSES.ECDSA_OWNERSHIP_REGISTRY_MODULE
    }: {
        signer: SmartAccountSigner<TSource, TAddress>
        entryPoint: Address
        index?: bigint
        factoryAddress?: Address
        accountLogicAddress?: Address
        fallbackHandlerAddress?: Address
        ecdsaModuleAddress?: Address
    }
): Promise<BiconomySmartAccount<TTransport, TChain>> {
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
            owner: viemSigner.address,
            index,
            factoryAddress,
            ecdsaModuleAddress
        })

    // Fetch account address and chain id
    const [accountAddress, chainId] = await Promise.all([
        getAccountAddress({
            owner: viemSigner.address,
            ecdsaModuleAddress,
            factoryAddress,
            accountLogicAddress,
            fallbackHandlerAddress,
            index
        }),
        getChainId(client)
    ])

    if (!accountAddress) throw new Error("Account address not found")

    // Build the EOA Signer
    const account = toAccount({
        address: accountAddress,
        async signMessage({ message }) {
            return signMessage(client, { account: viemSigner, message })
        },
        async signTransaction(_, __) {
            throw new SignTransactionNotSupportedBySmartAccount()
        },
        async signTypedData(typedData) {
            return signTypedData(client, { account: viemSigner, ...typedData })
        }
    })

    return {
        ...account,
        client: client,
        publicKey: accountAddress,
        entryPoint: entryPoint,
        source: "biconomySmartAccount",

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
            const signature = await signMessage(client, {
                account: viemSigner,
                message: { raw: hash }
            })
            // userOp signature is encoded module signature + module address
            const signatureWithModuleAddress = encodeAbiParameters(
                parseAbiParameters("bytes, address"),
                [signature, ecdsaModuleAddress]
            )
            return signatureWithModuleAddress
        },

        // Encode the init code
        async getInitCode() {
            const contractCode = await getBytecode(client, {
                address: accountAddress
            })

            if ((contractCode?.length ?? 0) > 2) return "0x"

            return generateInitCode()
        },

        // Encode the deploy call data
        async encodeDeployCallData(_) {
            throw new Error("Doesn't support account deployment")
        },

        // Encode a call
        async encodeCallData(args) {
            if (Array.isArray(args)) {
                // Encode a batched call
                const argsArray = args as {
                    to: Address
                    value: bigint
                    data: Hex
                }[]

                return encodeFunctionData({
                    abi: BiconomyExecuteAbi,
                    functionName: "executeBatch_y6U",
                    args: [
                        argsArray.map((a) => a.to),
                        argsArray.map((a) => a.value),
                        argsArray.map((a) => a.data)
                    ]
                })
            }
            const { to, value, data } = args as {
                to: Address
                value: bigint
                data: Hex
            }
            // Encode a simple call
            return encodeFunctionData({
                abi: BiconomyExecuteAbi,
                functionName: "execute_ncC",
                args: [to, value, data]
            })
        },

        // Get simple dummy signature for ECDSA module authorization
        async getDummySignature() {
            const moduleAddress =
                BICONOMY_ADDRESSES.ECDSA_OWNERSHIP_REGISTRY_MODULE
            const dynamicPart = moduleAddress.substring(2).padEnd(40, "0")
            return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`
        }
    }
}
