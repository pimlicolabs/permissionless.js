import {
    type Account,
    type Address,
    type Chain,
    type Client,
    type Hex,
    type Transport,
    concatHex,
    encodeFunctionData
} from "viem"
import { toAccount } from "viem/accounts"
import {
    getBytecode,
    getChainId,
    signMessage,
    signTypedData
} from "viem/actions"
import { getAccountNonce } from "../actions/public/getAccountNonce.js"
import { getSenderAddress } from "../actions/public/getSenderAddress.js"
import { getUserOperationHash } from "../utils/getUserOperationHash.js"
import {
    SignTransactionNotSupportedBySmartAccount,
    type SmartAccount,
    type SmartAccountSigner
} from "./types.js"

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

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function signerToSimpleSmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain>,
    {
        signer,
        factoryAddress,
        entryPoint,
        index = 0n
    }: {
        signer: SmartAccountSigner
        factoryAddress: Address
        entryPoint: Address
        index?: bigint
    }
): Promise<SimpleSmartAccount<TTransport, TChain>> {
    const viemSigner: Account =
        signer.type === "local"
            ? ({
                  ...signer,
                  signTransaction: (_, __) => {
                      throw new SignTransactionNotSupportedBySmartAccount()
                  }
              } as Account)
            : (signer as Account)

    const [accountAddress, chainId] = await Promise.all([
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
            const contractCode = await getBytecode(client, {
                address: accountAddress
            })

            if ((contractCode?.length ?? 0) > 2) return "0x"

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
        async getDummySignature() {
            return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
        }
    }
}
