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
    concat,
    encodeFunctionData,
    encodePacked,
    toHex
} from "viem"
import {
    type SmartAccount,
    type SmartAccountImplementation,
    entryPoint07Abi,
    entryPoint07Address,
    getUserOperationHash,
    toSmartAccount
} from "viem/account-abstraction"
import { readContract } from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce"
import { encode7579Calls } from "../../utils"
import { toOwner } from "../../utils/toOwner"

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
    client: Client
    owners: [
        OneOf<
            | EIP1193Provider
            | WalletClient<Transport, Chain | undefined, Account>
            | LocalAccount
        >
    ]
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
                args: [localOwner.address, index, attesters, threshold]
            })
        }
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
                args: [localOwner.address, index, attesters, threshold]
            })

            return accountAddress
        },
        async getNonce(args) {
            const TIMESTAMP_ADJUSTMENT = 16777215n
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
        async getStubSignature() {
            const dynamicPart = validatorAddress.substring(2).padEnd(40, "0")
            return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000` as Hex
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        async signMessage({ message }) {
            const signature = await localOwner.signMessage({
                message
            })

            return encodePacked(
                ["address", "bytes"],
                [validatorAddress, signature]
            )
        },
        // TODO: Implement this
        async signTypedData(_typedData) {
            return "0x"
        },
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
            return await localOwner.signMessage({
                message: { raw: hash as Hex }
            })
        }
    })
}
