import type {
    Account,
    Assign,
    Chain,
    OneOf,
    Prettify,
    Transport,
    TypedDataDefinition,
    WalletClient
} from "viem"
import {
    type Address,
    type Client,
    type Hex,
    type JsonRpcAccount,
    type LocalAccount,
    concat,
    concatHex,
    domainSeparator,
    encodeAbiParameters,
    encodeFunctionData,
    encodePacked,
    getTypesForEIP712Domain,
    hashMessage,
    hashTypedData,
    keccak256,
    stringToHex,
    toHex,
    validateTypedData
} from "viem"
import {
    type SmartAccount,
    type SmartAccountImplementation,
    entryPoint07Abi,
    entryPoint07Address,
    getUserOperationHash,
    toSmartAccount
} from "viem/account-abstraction"
import { getChainId, readContract } from "viem/actions"
import { getAction } from "viem/utils"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"
import { decode7579Calls } from "../../utils/decode7579Calls.js"
import { encode7579Calls } from "../../utils/encode7579Calls.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"

const wrapMessageHash = (
    messageHash: Hex,
    {
        accountAddress,
        version,
        chainId
    }: {
        accountAddress: Address
        version: "1.0.0"
        chainId: number
    }
) => {
    const _domainSeparator = domainSeparator({
        domain: {
            name: "Nexus",
            version: version,
            chainId,
            verifyingContract: accountAddress
        }
    })
    const parentStructHash = keccak256(
        encodeAbiParameters(
            [{ type: "bytes32" }, { type: "bytes32" }],
            [
                keccak256(stringToHex("PersonalSign(bytes prefixed)")),
                messageHash
            ]
        )
    )
    return keccak256(concatHex(["0x1901", _domainSeparator, parentStructHash]))
}

/**
 * The account creation ABI for Biconomy Smart Account (from the biconomy SmartAccountFactory)
 */

/**
 * Default addresses for Biconomy Smart Account
 */
const BICONOMY_ADDRESSES: {
    K1_VALIDATOR_FACTORY_ADDRESS: Address
    K1_VALIDATOR_ADDRESS: Address
} = {
    K1_VALIDATOR_FACTORY_ADDRESS: "0x00000bb19a3579F4D779215dEf97AFbd0e30DB55",
    K1_VALIDATOR_ADDRESS: "0x00000004171351c442B202678c48D8AB5B321E8f"
}

export type ToNexusSmartAccountParameters = Prettify<{
    client: Client<
        Transport,
        Chain | undefined,
        JsonRpcAccount | LocalAccount | undefined
    >
    owners: [
        OneOf<
            | EthereumProvider
            | WalletClient<Transport, Chain | undefined, Account>
            | LocalAccount
        >
    ]
    version: "1.0.0"
    address?: Address | undefined
    entryPoint?: {
        address: Address
        version: "0.7"
    }
    index?: bigint
    factoryAddress?: Address
    validatorAddress?: Address
    attesters?: Address[]
    threshold?: number
}>

export type NexusSmartAccountImplementation = Assign<
    SmartAccountImplementation<typeof entryPoint07Abi, "0.7">,
    { sign: NonNullable<SmartAccountImplementation["sign"]> }
>

export type ToNexusSmartAccountReturnType = Prettify<
    SmartAccount<NexusSmartAccountImplementation>
>

export async function toNexusSmartAccount(
    parameters: ToNexusSmartAccountParameters
): Promise<ToNexusSmartAccountReturnType> {
    const {
        owners,
        client,
        index = 0n,
        address,
        version,
        factoryAddress = BICONOMY_ADDRESSES.K1_VALIDATOR_FACTORY_ADDRESS,
        validatorAddress = BICONOMY_ADDRESSES.K1_VALIDATOR_ADDRESS,
        attesters = [],
        threshold = 0
    } = parameters

    const localOwner = await toOwner({ owner: owners[0] })

    const entryPoint = {
        address: parameters.entryPoint?.address ?? entryPoint07Address,
        abi: entryPoint07Abi,
        version: parameters.entryPoint?.version ?? "0.7"
    }

    let accountAddress: Address | undefined = address

    const getFactoryArgs = async () => {
        return {
            factory: factoryAddress,
            factoryData: encodeFunctionData({
                abi: [
                    {
                        name: "createAccount",
                        type: "function",
                        stateMutability: "nonpayable",
                        inputs: [
                            { type: "address", name: "eoaOwner" },
                            { type: "uint256", name: "index" },
                            { type: "address[]", name: "attesters" },
                            { type: "uint8", name: "threshold" }
                        ],
                        outputs: [{ type: "address" }]
                    }
                ],
                functionName: "createAccount",
                args: [
                    localOwner.address,
                    index,
                    attesters.sort((left, right) =>
                        left.toLowerCase().localeCompare(right.toLowerCase())
                    ),
                    threshold
                ]
            })
        }
    }

    let chainId: number
    const getMemoizedChainId = async () => {
        if (chainId) return chainId
        chainId = client.chain
            ? client.chain.id
            : await getAction(client, getChainId, "getChainId")({})
        return chainId
    }

    return toSmartAccount({
        client,
        entryPoint,
        getFactoryArgs,
        async getAddress() {
            if (accountAddress) return accountAddress

            accountAddress = await readContract(client, {
                address: factoryAddress,
                abi: [
                    {
                        name: "computeAccountAddress",
                        type: "function",
                        stateMutability: "view",
                        inputs: [
                            { type: "address", name: "eoaOwner" },
                            { type: "uint256", name: "index" },
                            { type: "address[]", name: "attesters" },
                            { type: "uint8", name: "threshold" }
                        ],
                        outputs: [{ type: "address" }]
                    }
                ],
                functionName: "computeAccountAddress",
                args: [
                    localOwner.address,
                    index,
                    attesters.sort((left, right) =>
                        left.toLowerCase().localeCompare(right.toLowerCase())
                    ),
                    threshold
                ]
            })

            return accountAddress
        },
        async getNonce(args) {
            const TIMESTAMP_ADJUSTMENT = 16777215n // max value for size 3
            const defaultedKey = (args?.key ?? 0n) % TIMESTAMP_ADJUSTMENT
            const defaultedValidationMode = "0x00"
            const key = concat([
                toHex(defaultedKey, { size: 3 }),
                defaultedValidationMode,
                validatorAddress
            ])

            const address = await this.getAddress()

            return getAccountNonce(client, {
                address,
                entryPointAddress: entryPoint.address,
                key: BigInt(key)
            })
        },
        encodeCalls: async (calls) => {
            return encode7579Calls({
                mode: {
                    type: calls.length > 1 ? "batchcall" : "call",
                    revertOnError: false,
                    selector: "0x",
                    context: "0x"
                },
                callData: calls
            })
        },
        async decodeCalls(callData) {
            return decode7579Calls(callData).callData
        },
        async getStubSignature() {
            const dynamicPart = validatorAddress.substring(2).padEnd(40, "0")
            return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000` as Hex
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        async signMessage({ message }) {
            const wrappedMessageHash = wrapMessageHash(hashMessage(message), {
                version,
                accountAddress: await this.getAddress(),
                chainId: await getMemoizedChainId()
            })

            const signature = await localOwner.signMessage({
                message: {
                    raw: wrappedMessageHash
                }
            })

            return encodePacked(
                ["address", "bytes"],
                [validatorAddress, signature]
            )
        },
        async signTypedData(typedData) {
            const {
                message,
                primaryType,
                types: _types,
                domain
            } = typedData as TypedDataDefinition

            const types = {
                EIP712Domain: getTypesForEIP712Domain({
                    domain: domain
                }),
                ..._types
            }

            validateTypedData({
                domain,
                message,
                primaryType,
                types
            })

            const typedHash = hashTypedData({
                message,
                primaryType,
                types,
                domain
            })

            const wrappedMessageHash = wrapMessageHash(typedHash, {
                version,
                accountAddress: await this.getAddress(),
                chainId: await getMemoizedChainId()
            })

            const signature = await localOwner.signMessage({
                message: {
                    raw: wrappedMessageHash
                }
            })

            return encodePacked(
                ["address", "bytes"],
                [validatorAddress, signature]
            )
        },
        async signUserOperation(parameters) {
            const { chainId = await getMemoizedChainId(), ...userOperation } =
                parameters

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
            return await localOwner.signMessage({
                message: { raw: hash as Hex }
            })
        }
    })
}
