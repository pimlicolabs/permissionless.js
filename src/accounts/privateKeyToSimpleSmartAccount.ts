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
import { getBytecode } from "viem/actions"
import { getAccountNonce } from "../actions/public/getAccountNonce.js"
import { getSenderAddress } from "../actions/public/getSenderAddress.js"
import { type SmartAccount } from "./types.js"

export class SignTransactionNotSupportedBySmartAccount extends BaseError {
    override name = "SignTransactionNotSupportedBySmartAccount"
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

export type PrivateKeySimpleSmartAccount<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<"privateKeySimpleSmartAccount", transport, chain>

const getAccountInitCode = async (factoryAddress: Address, owner: Address, index = 0n): Promise<Hex> => {
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
    owner
}: {
    client: Client<TTransport, TChain>
    factoryAddress: Address
    owner: Address
    entryPoint: Address
}): Promise<Address> => {
    const initCode = await getAccountInitCode(factoryAddress, owner)

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
export async function privateKeyToSimpleSmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain>,
    {
        privateKey,
        factoryAddress,
        entryPoint
    }: {
        privateKey: Hex
        factoryAddress: Address
        entryPoint: Address
    }
): Promise<PrivateKeySimpleSmartAccount<TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)

    const accountAddress = await getAccountAddress<TTransport, TChain>({
        client,
        factoryAddress,
        entryPoint,
        owner: privateKeyAccount.address
    })

    if (!accountAddress) throw new Error("Account address not found")

    const account = toAccount({
        address: accountAddress,
        async signMessage({ message }) {
            return privateKeyAccount.signMessage({ message })
        },
        async signTransaction(_, __) {
            throw new SignTransactionNotSupportedBySmartAccount()
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
        source: "privateKeySimpleSmartAccount",
        async getNonce() {
            return getAccountNonce(client, {
                sender: accountAddress,
                entryPoint: entryPoint
            })
        },
        async getInitCode() {
            const contractCode = await getBytecode(client, {
                address: accountAddress
            })

            if ((contractCode?.length ?? 0) > 2) return "0x"

            return getAccountInitCode(factoryAddress, privateKeyAccount.address)
        },
        async encodeCallData({ to, value, data }) {
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
