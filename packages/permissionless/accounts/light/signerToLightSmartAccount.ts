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
    encodeFunctionData,
    hashMessage,
    hashTypedData
} from "viem"
import { getChainId, signMessage } from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce"
import { getSenderAddress } from "../../actions/public/getSenderAddress"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    Prettify
} from "../../types"
import type { EntryPoint } from "../../types/entrypoint"
import { getEntryPointVersion } from "../../utils"
import { getUserOperationHash } from "../../utils/getUserOperationHash"
import { isSmartAccountDeployed } from "../../utils/isSmartAccountDeployed"
import { toSmartAccount } from "../toSmartAccount"
import {
    SignTransactionNotSupportedBySmartAccount,
    type SmartAccount,
    type SmartAccountSigner
} from "../types"

export type LightSmartAccount<
    entryPoint extends EntryPoint,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<entryPoint, "LightSmartAccount", transport, chain>

const getAccountInitCode = async (
    owner: Address,
    index = BigInt(0)
): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")

    return encodeFunctionData({
        abi: [
            {
                inputs: [
                    {
                        internalType: "address",
                        name: "owner",
                        type: "address"
                    },
                    {
                        internalType: "uint256",
                        name: "salt",
                        type: "uint256"
                    }
                ],
                name: "createAccount",
                outputs: [
                    {
                        internalType: "contract LightAccount",
                        name: "ret",
                        type: "address"
                    }
                ],
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        functionName: "createAccount",
        args: [owner, index]
    })
}

const getAccountAddress = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>({
    client,
    factoryAddress,
    entryPoint: entryPointAddress,
    owner,
    index = BigInt(0)
}: {
    client: Client<TTransport, TChain>
    factoryAddress: Address
    owner: Address
    entryPoint: entryPoint
    index?: bigint
}): Promise<Address> => {
    const entryPointVersion = getEntryPointVersion(entryPointAddress)

    const factoryData = await getAccountInitCode(owner, index)

    if (entryPointVersion === "v0.6") {
        return getSenderAddress<ENTRYPOINT_ADDRESS_V06_TYPE>(client, {
            initCode: concatHex([factoryAddress, factoryData]),
            entryPoint: entryPointAddress as ENTRYPOINT_ADDRESS_V06_TYPE
        })
    }

    // Get the sender address based on the init code
    return getSenderAddress<ENTRYPOINT_ADDRESS_V07_TYPE>(client, {
        factory: factoryAddress,
        factoryData,
        entryPoint: entryPointAddress as ENTRYPOINT_ADDRESS_V07_TYPE
    })
}

export type LightAccountVersion = "1.1.0"

export type SignerToLightSmartAccountParameters<
    entryPoint extends EntryPoint,
    TSource extends string = string,
    TAddress extends Address = Address
> = Prettify<{
    signer: SmartAccountSigner<TSource, TAddress>
    lightAccountVersion: LightAccountVersion
    entryPoint: entryPoint
    factoryAddress?: Address
    index?: bigint
    address?: Address
}>

async function signWith1271WrapperV1<
    TSource extends string = string,
    TAddress extends Address = Address
>(
    signer: SmartAccountSigner<TSource, TAddress>,
    chainId: number,
    accountAddress: Address,
    hashedMessage: Hex
): Promise<Hex> {
    return signer.signTypedData({
        domain: {
            chainId: Number(chainId),
            name: "LightAccount",
            verifyingContract: accountAddress,
            version: "1"
        },
        types: {
            LightAccountMessage: [{ name: "message", type: "bytes" }]
        },
        message: {
            message: hashedMessage
        },
        primaryType: "LightAccountMessage"
    })
}

const LIGHT_VERSION_TO_ADDRESSES_MAP: {
    [key in LightAccountVersion]: {
        factoryAddress: Address
    }
} = {
    "1.1.0": {
        factoryAddress: "0x00004EC70002a32400f8ae005A26081065620D20"
    }
}

const getDefaultAddresses = (
    lightAccountVersion: LightAccountVersion,
    {
        factoryAddress: _factoryAddress
    }: {
        factoryAddress?: Address
    }
) => {
    const factoryAddress =
        _factoryAddress ??
        LIGHT_VERSION_TO_ADDRESSES_MAP[lightAccountVersion].factoryAddress

    return {
        factoryAddress
    }
}

/**
 * @description Creates an Light Account from a private key.
 *
 * @returns A Private Key Light Account.
 */
export async function signerToLightSmartAccount<
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address
>(
    client: Client<TTransport, TChain, undefined>,
    {
        signer,
        address,
        lightAccountVersion,
        entryPoint: entryPointAddress,
        index = BigInt(0),
        factoryAddress: _factoryAddress
    }: SignerToLightSmartAccountParameters<entryPoint, TSource, TAddress>
): Promise<LightSmartAccount<entryPoint, TTransport, TChain>> {
    const viemSigner: LocalAccount = {
        ...signer,
        signTransaction: (_, __) => {
            throw new SignTransactionNotSupportedBySmartAccount()
        }
    } as LocalAccount

    if (lightAccountVersion !== "1.1.0") {
        throw new Error(
            "Only Light Account version 1.1.0 is supported at the moment"
        )
    }

    const { factoryAddress } = getDefaultAddresses(lightAccountVersion, {
        factoryAddress: _factoryAddress
    })

    const [accountAddress, chainId] = await Promise.all([
        address ??
            getAccountAddress<entryPoint, TTransport, TChain>({
                client,
                factoryAddress,
                entryPoint: entryPointAddress,
                owner: viemSigner.address,
                index
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
        signMessage: async ({ message }) => {
            return signWith1271WrapperV1<TSource, TAddress>(
                signer,
                chainId,
                accountAddress,
                hashMessage(message)
            )
        },
        signTransaction: (_, __) => {
            throw new SignTransactionNotSupportedBySmartAccount()
        },
        async signTypedData<
            const TTypedData extends TypedData | Record<string, unknown>,
            TPrimaryType extends
                | keyof TTypedData
                | "EIP712Domain" = keyof TTypedData
        >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
            return signWith1271WrapperV1<TSource, TAddress>(
                signer,
                chainId,
                accountAddress,
                hashTypedData(typedData)
            )
        },
        client: client,
        publicKey: accountAddress,
        entryPoint: entryPointAddress,
        source: "LightSmartAccount",
        async getNonce() {
            return getAccountNonce(client, {
                sender: accountAddress,
                entryPoint: entryPointAddress
            })
        },
        async signUserOperation(userOperation) {
            return signMessage(client, {
                account: viemSigner,
                message: {
                    raw: getUserOperationHash({
                        userOperation,
                        entryPoint: entryPointAddress,
                        chainId: chainId
                    })
                }
            })
        },
        async getInitCode() {
            if (smartAccountDeployed) return "0x"

            smartAccountDeployed = await isSmartAccountDeployed(
                client,
                accountAddress
            )

            if (smartAccountDeployed) return "0x"

            return concatHex([
                factoryAddress,
                await getAccountInitCode(viemSigner.address, index)
            ])
        },
        async getFactory() {
            if (smartAccountDeployed) return undefined
            smartAccountDeployed = await isSmartAccountDeployed(
                client,
                accountAddress
            )
            if (smartAccountDeployed) return undefined
            return factoryAddress
        },
        async getFactoryData() {
            if (smartAccountDeployed) return undefined
            smartAccountDeployed = await isSmartAccountDeployed(
                client,
                accountAddress
            )
            if (smartAccountDeployed) return undefined
            return getAccountInitCode(viemSigner.address, index)
        },
        async encodeDeployCallData(_) {
            throw new Error("Light account doesn't support account deployment")
        },
        async encodeCallData(args) {
            if (Array.isArray(args)) {
                const argsArray = args as {
                    to: Address
                    value: bigint
                    data: Hex
                }[]

                return encodeFunctionData({
                    abi: [
                        {
                            inputs: [
                                {
                                    internalType: "address[]",
                                    name: "dest",
                                    type: "address[]"
                                },
                                {
                                    internalType: "uint256[]",
                                    name: "value",
                                    type: "uint256[]"
                                },
                                {
                                    internalType: "bytes[]",
                                    name: "func",
                                    type: "bytes[]"
                                }
                            ],
                            name: "executeBatch",
                            outputs: [],
                            stateMutability: "nonpayable",
                            type: "function"
                        }
                    ],
                    functionName: "executeBatch",
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

            return encodeFunctionData({
                abi: [
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "dest",
                                type: "address"
                            },
                            {
                                internalType: "uint256",
                                name: "value",
                                type: "uint256"
                            },
                            {
                                internalType: "bytes",
                                name: "func",
                                type: "bytes"
                            }
                        ],
                        name: "execute",
                        outputs: [],
                        stateMutability: "nonpayable",
                        type: "function"
                    }
                ],
                functionName: "execute",
                args: [to, value, data]
            })
        },
        async getDummySignature(_userOperation) {
            return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
        }
    })
}
