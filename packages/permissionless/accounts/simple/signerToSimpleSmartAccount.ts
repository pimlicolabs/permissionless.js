import type { TypedData } from "viem"
import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type LocalAccount,
    type Transport,
    type TypedDataDefinition,
    concatHex,
    encodeFunctionData
} from "viem"
import { toAccount } from "viem/accounts"
import { getChainId, signMessage, signTypedData } from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce"
import { getSenderAddress } from "../../actions/public/getSenderAddress"
import type { Prettify } from "../../types"
import { getUserOperationHash } from "../../utils/getUserOperationHash"
import { isSmartAccountDeployed } from "../../utils/isSmartAccountDeployed"
import {
    SignTransactionNotSupportedBySmartAccount,
    type SmartAccount,
    type SmartAccountSigner
} from "../types"

export type SimpleSmartAccount<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<"SimpleSmartAccount", transport, chain>

const getAccountInitCode = async (
    factoryAddress: Address,
    owner: Address,
    index = 0n
): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")

    return concatHex([
        factoryAddress,
        encodeFunctionData({
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
                            internalType: "contract SimpleAccount",
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
        }) as Hex
    ])
}

const getAccountAddress = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>({
    client,
    factoryAddress,
    entryPoint,
    owner,
    index = 0n
}: {
    client: Client<TTransport, TChain>
    factoryAddress: Address
    owner: Address
    entryPoint: Address
    index?: bigint
}): Promise<Address> => {
    const initCode = await getAccountInitCode(factoryAddress, owner, index)

    return getSenderAddress(client, {
        initCode,
        entryPoint
    })
}

export type SignerToSimpleSmartAccountParameters<
    TSource extends string = string,
    TAddress extends Address = Address
> = Prettify<{
    signer: SmartAccountSigner<TSource, TAddress>
    factoryAddress: Address
    entryPoint: Address
    index?: bigint
    address?: Address
}>

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function signerToSimpleSmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address
>(
    client: Client<TTransport, TChain, undefined>,
    {
        signer,
        factoryAddress,
        entryPoint,
        index = 0n,
        address
    }: SignerToSimpleSmartAccountParameters<TSource, TAddress>
): Promise<SimpleSmartAccount<TTransport, TChain>> {
    const viemSigner: LocalAccount = {
        ...signer,
        signTransaction: (_, __) => {
            throw new SignTransactionNotSupportedBySmartAccount()
        }
    } as LocalAccount

    const [accountAddress, chainId] = await Promise.all([
        address ??
            getAccountAddress<TTransport, TChain>({
                client,
                factoryAddress,
                entryPoint,
                owner: viemSigner.address,
                index
            }),
        getChainId(client)
    ])

    if (!accountAddress) throw new Error("Account address not found")

    let smartAccountDeployed = await isSmartAccountDeployed(
        client,
        accountAddress
    )

    const account = toAccount({
        address: accountAddress,
        async signMessage({ message }) {
            return signMessage(client, { account: viemSigner, message })
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
            return signTypedData<TTypedData, TPrimaryType, TChain, undefined>(
                client,
                {
                    account: viemSigner,
                    ...typedData
                }
            )
        }
    })

    return {
        ...account,
        client: client,
        publicKey: accountAddress,
        entryPoint: entryPoint,
        source: "SimpleSmartAccount",
        async getNonce() {
            return getAccountNonce(client, {
                sender: accountAddress,
                entryPoint: entryPoint
            })
        },
        async signUserOperation(userOperation) {
            return account.signMessage({
                message: {
                    raw: getUserOperationHash({
                        userOperation,
                        entryPoint: entryPoint,
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

            return getAccountInitCode(factoryAddress, viemSigner.address, index)
        },
        async encodeDeployCallData(_) {
            throw new Error("Simple account doesn't support account deployment")
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
    }
}
