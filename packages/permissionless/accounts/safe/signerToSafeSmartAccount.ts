import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type LocalAccount,
    type SignableMessage,
    type Transport,
    type TypedData,
    type TypedDataDefinition,
    concat,
    concatHex,
    encodeFunctionData,
    encodePacked,
    getContractAddress,
    hashMessage,
    hashTypedData,
    hexToBigInt,
    keccak256,
    pad,
    toBytes,
    toHex,
    zeroAddress
} from "viem"
import {
    getChainId,
    readContract,
    signMessage,
    signTypedData
} from "viem/actions"
import { getAccountNonce } from "../../actions/public/getAccountNonce"
import type {
    EntryPointVersion,
    GetEntryPointVersion,
    Prettify
} from "../../types"
import type { EntryPoint, UserOperation } from "../../types"
import {
    getEntryPointVersion,
    isUserOperationVersion06,
    isUserOperationVersion07
} from "../../utils/getEntryPointVersion"
import { isSmartAccountDeployed } from "../../utils/isSmartAccountDeployed"
import { toSmartAccount } from "../toSmartAccount"
import {
    SignTransactionNotSupportedBySmartAccount,
    type SmartAccount,
    type SmartAccountSigner
} from "../types"

export type SafeVersion = "1.4.1"

const EIP712_SAFE_OPERATION_TYPE_V06 = {
    SafeOp: [
        { type: "address", name: "safe" },
        { type: "uint256", name: "nonce" },
        { type: "bytes", name: "initCode" },
        { type: "bytes", name: "callData" },
        { type: "uint256", name: "callGasLimit" },
        { type: "uint256", name: "verificationGasLimit" },
        { type: "uint256", name: "preVerificationGas" },
        { type: "uint256", name: "maxFeePerGas" },
        { type: "uint256", name: "maxPriorityFeePerGas" },
        { type: "bytes", name: "paymasterAndData" },
        { type: "uint48", name: "validAfter" },
        { type: "uint48", name: "validUntil" },
        { type: "address", name: "entryPoint" }
    ]
}

const EIP712_SAFE_OPERATION_TYPE_V07 = {
    SafeOp: [
        { type: "address", name: "safe" },
        { type: "uint256", name: "nonce" },
        { type: "bytes", name: "initCode" },
        { type: "bytes", name: "callData" },
        { type: "uint128", name: "verificationGasLimit" },
        { type: "uint128", name: "callGasLimit" },
        { type: "uint256", name: "preVerificationGas" },
        { type: "uint128", name: "maxPriorityFeePerGas" },
        { type: "uint128", name: "maxFeePerGas" },
        { type: "bytes", name: "paymasterAndData" },
        { type: "uint48", name: "validAfter" },
        { type: "uint48", name: "validUntil" },
        { type: "address", name: "entryPoint" }
    ]
}

const SAFE_VERSION_TO_ADDRESSES_MAP: {
    [key in SafeVersion]: {
        [key in EntryPointVersion]: {
            SAFE_MODULE_SETUP_ADDRESS: Address
            SAFE_4337_MODULE_ADDRESS: Address
            SAFE_PROXY_FACTORY_ADDRESS: Address
            SAFE_SINGLETON_ADDRESS: Address
            MULTI_SEND_ADDRESS: Address
            MULTI_SEND_CALL_ONLY_ADDRESS: Address
        }
    }
} = {
    "1.4.1": {
        "v0.6": {
            SAFE_MODULE_SETUP_ADDRESS:
                "0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb",
            SAFE_4337_MODULE_ADDRESS:
                "0xa581c4A4DB7175302464fF3C06380BC3270b4037",
            SAFE_PROXY_FACTORY_ADDRESS:
                "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
            SAFE_SINGLETON_ADDRESS:
                "0x41675C099F32341bf84BFc5382aF534df5C7461a",
            MULTI_SEND_ADDRESS: "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526",
            MULTI_SEND_CALL_ONLY_ADDRESS:
                "0x9641d764fc13c8B624c04430C7356C1C7C8102e2"
        },
        "v0.7": {
            SAFE_MODULE_SETUP_ADDRESS:
                "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47",
            SAFE_4337_MODULE_ADDRESS:
                "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226",
            SAFE_PROXY_FACTORY_ADDRESS:
                "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
            SAFE_SINGLETON_ADDRESS:
                "0x41675C099F32341bf84BFc5382aF534df5C7461a",
            MULTI_SEND_ADDRESS: "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526",
            MULTI_SEND_CALL_ONLY_ADDRESS:
                "0x9641d764fc13c8B624c04430C7356C1C7C8102e2"
        }
    }
}

const adjustVInSignature = (
    signingMethod: "eth_sign" | "eth_signTypedData",
    signature: string
): Hex => {
    const ETHEREUM_V_VALUES = [0, 1, 27, 28]
    const MIN_VALID_V_VALUE_FOR_SAFE_ECDSA = 27
    let signatureV = Number.parseInt(signature.slice(-2), 16)
    if (!ETHEREUM_V_VALUES.includes(signatureV)) {
        throw new Error("Invalid signature")
    }
    if (signingMethod === "eth_sign") {
        if (signatureV < MIN_VALID_V_VALUE_FOR_SAFE_ECDSA) {
            signatureV += MIN_VALID_V_VALUE_FOR_SAFE_ECDSA
        }
        signatureV += 4
    }
    if (signingMethod === "eth_signTypedData") {
        if (signatureV < MIN_VALID_V_VALUE_FOR_SAFE_ECDSA) {
            signatureV += MIN_VALID_V_VALUE_FOR_SAFE_ECDSA
        }
    }
    return (signature.slice(0, -2) + signatureV.toString(16)) as Hex
}

const generateSafeMessageMessage = <
    const TTypedData extends TypedData | { [key: string]: unknown },
    TPrimaryType extends keyof TTypedData | "EIP712Domain" = keyof TTypedData
>(
    message: SignableMessage | TypedDataDefinition<TTypedData, TPrimaryType>
): Hex => {
    const signableMessage = message as SignableMessage

    if (typeof signableMessage === "string" || signableMessage.raw) {
        return hashMessage(signableMessage)
    }

    return hashTypedData(
        message as TypedDataDefinition<TTypedData, TPrimaryType>
    )
}

const encodeInternalTransaction = (tx: {
    to: Address
    data: Address
    value: bigint
    operation: 0 | 1
}): string => {
    const encoded = encodePacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [
            tx.operation,
            tx.to,
            tx.value,
            BigInt(tx.data.slice(2).length / 2),
            tx.data
        ]
    )
    return encoded.slice(2)
}

const encodeMultiSend = (
    txs: {
        to: Address
        data: Address
        value: bigint
        operation: 0 | 1
    }[]
): `0x${string}` => {
    const data: `0x${string}` = `0x${txs
        .map((tx) => encodeInternalTransaction(tx))
        .join("")}`

    return encodeFunctionData({
        abi: [
            {
                inputs: [
                    {
                        internalType: "bytes",
                        name: "transactions",
                        type: "bytes"
                    }
                ],
                name: "multiSend",
                outputs: [],
                stateMutability: "payable",
                type: "function"
            }
        ],
        functionName: "multiSend",
        args: [data]
    })
}

export type SafeSmartAccount<
    entryPoint extends EntryPoint,
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined
> = SmartAccount<entryPoint, "SafeSmartAccount", transport, chain>

const getInitializerCode = async ({
    owner,
    safeModuleSetupAddress,
    safe4337ModuleAddress,
    multiSendAddress,
    setupTransactions = [],
    safeModules = []
}: {
    owner: Address
    safeModuleSetupAddress: Address
    safe4337ModuleAddress: Address
    multiSendAddress: Address
    setupTransactions?: {
        to: Address
        data: Address
        value: bigint
    }[]
    safeModules?: Address[]
}) => {
    const multiSendCallData = encodeMultiSend([
        {
            to: safeModuleSetupAddress,
            data: encodeFunctionData({
                abi: [
                    {
                        inputs: [
                            {
                                internalType: "address[]",
                                name: "modules",
                                type: "address[]"
                            }
                        ],
                        name: "enableModules",
                        outputs: [],
                        stateMutability: "nonpayable",
                        type: "function"
                    }
                ],
                functionName: "enableModules",
                args: [[safe4337ModuleAddress, ...safeModules]]
            }),
            value: BigInt(0),
            operation: 1
        },
        ...setupTransactions.map((tx) => ({ ...tx, operation: 0 as 0 | 1 }))
    ])

    return encodeFunctionData({
        abi: [
            {
                inputs: [
                    {
                        internalType: "address[]",
                        name: "_owners",
                        type: "address[]"
                    },
                    {
                        internalType: "uint256",
                        name: "_threshold",
                        type: "uint256"
                    },
                    {
                        internalType: "address",
                        name: "to",
                        type: "address"
                    },
                    {
                        internalType: "bytes",
                        name: "data",
                        type: "bytes"
                    },
                    {
                        internalType: "address",
                        name: "fallbackHandler",
                        type: "address"
                    },
                    {
                        internalType: "address",
                        name: "paymentToken",
                        type: "address"
                    },
                    {
                        internalType: "uint256",
                        name: "payment",
                        type: "uint256"
                    },
                    {
                        internalType: "address payable",
                        name: "paymentReceiver",
                        type: "address"
                    }
                ],
                name: "setup",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        functionName: "setup",
        args: [
            [owner],
            BigInt(1),
            multiSendAddress,
            multiSendCallData,
            safe4337ModuleAddress,
            zeroAddress,
            BigInt(0),
            zeroAddress
        ]
    })
}

function getPaymasterAndData(unpackedUserOperation: UserOperation<"v0.7">) {
    return unpackedUserOperation.paymaster
        ? concat([
              unpackedUserOperation.paymaster,
              pad(
                  toHex(
                      unpackedUserOperation.paymasterVerificationGasLimit ||
                          BigInt(0)
                  ),
                  {
                      size: 16
                  }
              ),
              pad(
                  toHex(
                      unpackedUserOperation.paymasterPostOpGasLimit || BigInt(0)
                  ),
                  {
                      size: 16
                  }
              ),
              unpackedUserOperation.paymasterData || ("0x" as Hex)
          ])
        : "0x"
}

const getAccountInitCode = async ({
    owner,
    safeModuleSetupAddress,
    safe4337ModuleAddress,
    safeSingletonAddress,
    multiSendAddress,
    saltNonce = BigInt(0),
    setupTransactions = [],
    safeModules = []
}: {
    owner: Address
    safeModuleSetupAddress: Address
    safe4337ModuleAddress: Address
    safeSingletonAddress: Address
    multiSendAddress: Address
    saltNonce?: bigint
    setupTransactions?: {
        to: Address
        data: Address
        value: bigint
    }[]
    safeModules?: Address[]
}): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")
    const initializer = await getInitializerCode({
        owner,
        safeModuleSetupAddress,
        safe4337ModuleAddress,
        multiSendAddress,
        setupTransactions,
        safeModules
    })

    const initCodeCallData = encodeFunctionData({
        abi: [
            {
                inputs: [
                    {
                        internalType: "address",
                        name: "_singleton",
                        type: "address"
                    },
                    {
                        internalType: "bytes",
                        name: "initializer",
                        type: "bytes"
                    },
                    {
                        internalType: "uint256",
                        name: "saltNonce",
                        type: "uint256"
                    }
                ],
                name: "createProxyWithNonce",
                outputs: [
                    {
                        internalType: "contract SafeProxy",
                        name: "proxy",
                        type: "address"
                    }
                ],
                stateMutability: "nonpayable",
                type: "function"
            }
        ],
        functionName: "createProxyWithNonce",
        args: [safeSingletonAddress, initializer, saltNonce]
    })

    return initCodeCallData
}

const getAccountAddress = async <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>({
    client,
    owner,
    safeModuleSetupAddress,
    safe4337ModuleAddress,
    safeProxyFactoryAddress,
    safeSingletonAddress,
    multiSendAddress,
    setupTransactions = [],
    safeModules = [],
    saltNonce = BigInt(0)
}: {
    client: Client<TTransport, TChain>
    owner: Address
    safeModuleSetupAddress: Address
    safe4337ModuleAddress: Address
    safeProxyFactoryAddress: Address
    safeSingletonAddress: Address
    multiSendAddress: Address
    setupTransactions: {
        to: Address
        data: Address
        value: bigint
    }[]
    safeModules?: Address[]
    saltNonce?: bigint
}): Promise<Address> => {
    const proxyCreationCode = await readContract(client, {
        abi: [
            {
                inputs: [],
                name: "proxyCreationCode",
                outputs: [
                    {
                        internalType: "bytes",
                        name: "",
                        type: "bytes"
                    }
                ],
                stateMutability: "pure",
                type: "function"
            }
        ],
        address: safeProxyFactoryAddress,
        functionName: "proxyCreationCode"
    })

    const deploymentCode = encodePacked(
        ["bytes", "uint256"],
        [proxyCreationCode, hexToBigInt(safeSingletonAddress)]
    )

    const initializer = await getInitializerCode({
        owner,
        safeModuleSetupAddress,
        safe4337ModuleAddress,
        multiSendAddress,
        setupTransactions,
        safeModules
    })

    const salt = keccak256(
        encodePacked(
            ["bytes32", "uint256"],
            [keccak256(encodePacked(["bytes"], [initializer])), saltNonce]
        )
    )

    return getContractAddress({
        from: safeProxyFactoryAddress,
        salt,
        bytecode: deploymentCode,
        opcode: "CREATE2"
    })
}

const getDefaultAddresses = (
    safeVersion: SafeVersion,
    entryPointAddress: EntryPoint,
    {
        addModuleLibAddress: _addModuleLibAddress,
        safeModuleSetupAddress: _safeModuleSetupAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress
    }: {
        addModuleLibAddress?: Address
        safeModuleSetupAddress?: Address
        safe4337ModuleAddress?: Address
        safeProxyFactoryAddress?: Address
        safeSingletonAddress?: Address
        multiSendAddress?: Address
        multiSendCallOnlyAddress?: Address
    }
) => {
    const entryPointVersion = getEntryPointVersion(entryPointAddress)

    const safeModuleSetupAddress =
        _safeModuleSetupAddress ??
        _addModuleLibAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]
            .SAFE_MODULE_SETUP_ADDRESS
    const safe4337ModuleAddress =
        _safe4337ModuleAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]
            .SAFE_4337_MODULE_ADDRESS
    const safeProxyFactoryAddress =
        _safeProxyFactoryAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]
            .SAFE_PROXY_FACTORY_ADDRESS
    const safeSingletonAddress =
        _safeSingletonAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]
            .SAFE_SINGLETON_ADDRESS
    const multiSendAddress =
        _multiSendAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][entryPointVersion]
            .MULTI_SEND_ADDRESS

    const multiSendCallOnlyAddress =
        _multiSendCallOnlyAddress ??
        SAFE_VERSION_TO_ADDRESSES_MAP[safeVersion][
            getEntryPointVersion(entryPointAddress)
        ].MULTI_SEND_CALL_ONLY_ADDRESS

    return {
        safeModuleSetupAddress,
        safe4337ModuleAddress,
        safeProxyFactoryAddress,
        safeSingletonAddress,
        multiSendAddress,
        multiSendCallOnlyAddress
    }
}

export type SignerToSafeSmartAccountParameters<
    entryPoint extends EntryPoint,
    TSource extends string = string,
    TAddress extends Address = Address
> = Prettify<{
    signer: SmartAccountSigner<TSource, TAddress>
    safeVersion: SafeVersion
    entryPoint: entryPoint
    address?: Address
    safeModuleSetupAddress?: Address
    safe4337ModuleAddress?: Address
    safeProxyFactoryAddress?: Address
    safeSingletonAddress?: Address
    multiSendAddress?: Address
    multiSendCallOnlyAddress?: Address
    saltNonce?: bigint
    validUntil?: number
    validAfter?: number
    setupTransactions?: {
        to: Address
        data: Address
        value: bigint
    }[]
    safeModules?: Address[]
}>

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function signerToSafeSmartAccount<
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TSource extends string = string,
    TAddress extends Address = Address
>(
    client: Client<TTransport, TChain>,
    {
        signer,
        address,
        safeVersion,
        entryPoint: entryPointAddress,
        safeModuleSetupAddress: _safeModuleSetupAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress,
        saltNonce = BigInt(0),
        validUntil = 0,
        validAfter = 0,
        safeModules = [],
        setupTransactions = []
    }: SignerToSafeSmartAccountParameters<entryPoint, TSource, TAddress>
): Promise<SafeSmartAccount<entryPoint, TTransport, TChain>> {
    const chainId = client.chain?.id ?? (await getChainId(client))

    const viemSigner: LocalAccount = {
        ...signer,
        signTransaction: (_, __) => {
            throw new SignTransactionNotSupportedBySmartAccount()
        }
    } as LocalAccount

    const {
        safeModuleSetupAddress,
        safe4337ModuleAddress,
        safeProxyFactoryAddress,
        safeSingletonAddress,
        multiSendAddress,
        multiSendCallOnlyAddress
    } = getDefaultAddresses(safeVersion, entryPointAddress, {
        safeModuleSetupAddress: _safeModuleSetupAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress
    })

    const accountAddress =
        address ??
        (await getAccountAddress<TTransport, TChain>({
            client,
            owner: viemSigner.address,
            safeModuleSetupAddress,
            safe4337ModuleAddress,
            safeProxyFactoryAddress,
            safeSingletonAddress,
            multiSendAddress,
            saltNonce,
            setupTransactions,
            safeModules
        }))

    if (!accountAddress) throw new Error("Account address not found")

    let safeDeployed = await isSmartAccountDeployed(client, accountAddress)

    const safeSmartAccount: SafeSmartAccount<entryPoint, TTransport, TChain> =
        toSmartAccount({
            address: accountAddress,
            async signMessage({ message }) {
                const messageHash = hashTypedData({
                    domain: {
                        chainId: chainId,
                        verifyingContract: accountAddress
                    },
                    types: {
                        SafeMessage: [{ name: "message", type: "bytes" }]
                    },
                    primaryType: "SafeMessage",
                    message: {
                        message: generateSafeMessageMessage(message)
                    }
                })

                return adjustVInSignature(
                    "eth_sign",
                    await signMessage(client, {
                        account: viemSigner,
                        message: {
                            raw: toBytes(messageHash)
                        }
                    })
                )
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
                return adjustVInSignature(
                    "eth_signTypedData",
                    await signTypedData(client, {
                        account: viemSigner,
                        domain: {
                            chainId: chainId,
                            verifyingContract: accountAddress
                        },
                        types: {
                            SafeMessage: [{ name: "message", type: "bytes" }]
                        },
                        primaryType: "SafeMessage",
                        message: {
                            message: generateSafeMessageMessage<
                                TTypedData,
                                TPrimaryType
                            >(typedData)
                        }
                    })
                )
            },
            client: client,
            publicKey: accountAddress,
            entryPoint: entryPointAddress,
            source: "SafeSmartAccount",
            async getNonce() {
                return getAccountNonce(client, {
                    sender: accountAddress,
                    entryPoint: entryPointAddress
                })
            },
            async signUserOperation(
                userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
            ) {
                const message = {
                    safe: accountAddress,
                    callData: userOperation.callData,
                    nonce: userOperation.nonce,
                    initCode: userOperation.initCode ?? "0x",
                    maxFeePerGas: userOperation.maxFeePerGas,
                    maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
                    preVerificationGas: userOperation.preVerificationGas,
                    verificationGasLimit: userOperation.verificationGasLimit,
                    callGasLimit: userOperation.callGasLimit,
                    paymasterAndData: userOperation.paymasterAndData ?? "0x",
                    validAfter: validAfter,
                    validUntil: validUntil,
                    entryPoint: entryPointAddress
                }

                if (
                    isUserOperationVersion06(entryPointAddress, userOperation)
                ) {
                    message.paymasterAndData = userOperation.paymasterAndData
                }

                if (
                    isUserOperationVersion07(entryPointAddress, userOperation)
                ) {
                    if (userOperation.factory && userOperation.factoryData) {
                        message.initCode = concatHex([
                            userOperation.factory,
                            userOperation.factoryData
                        ])
                    }
                    message.paymasterAndData =
                        getPaymasterAndData(userOperation)
                }

                const signatures = [
                    {
                        signer: viemSigner.address,
                        data: await signTypedData(client, {
                            account: viemSigner,
                            domain: {
                                chainId: chainId,
                                verifyingContract: safe4337ModuleAddress
                            },
                            types:
                                getEntryPointVersion(entryPointAddress) ===
                                "v0.6"
                                    ? EIP712_SAFE_OPERATION_TYPE_V06
                                    : EIP712_SAFE_OPERATION_TYPE_V07,
                            primaryType: "SafeOp",
                            message: message
                        })
                    }
                ]

                signatures.sort((left, right) =>
                    left.signer
                        .toLowerCase()
                        .localeCompare(right.signer.toLowerCase())
                )

                const signatureBytes = concat(signatures.map((sig) => sig.data))

                return encodePacked(
                    ["uint48", "uint48", "bytes"],
                    [validAfter, validUntil, signatureBytes]
                )
            },
            async getInitCode() {
                safeDeployed =
                    safeDeployed ||
                    (await isSmartAccountDeployed(client, accountAddress))

                if (safeDeployed) return "0x"

                return concatHex([
                    (await this.getFactory()) ?? "0x",
                    (await this.getFactoryData()) ?? "0x"
                ])
            },
            async getFactory() {
                safeDeployed =
                    safeDeployed ||
                    (await isSmartAccountDeployed(client, accountAddress))

                if (safeDeployed) return undefined

                return safeProxyFactoryAddress
            },
            async getFactoryData() {
                safeDeployed =
                    safeDeployed ||
                    (await isSmartAccountDeployed(client, accountAddress))

                if (safeDeployed) return undefined

                return await getAccountInitCode({
                    owner: viemSigner.address,
                    safeModuleSetupAddress,
                    safe4337ModuleAddress,
                    safeSingletonAddress,
                    multiSendAddress,
                    saltNonce,
                    setupTransactions,
                    safeModules
                })
            },
            async encodeDeployCallData(_) {
                throw new Error(
                    "Safe account doesn't support account deployment"
                )
            },
            async encodeCallData(args) {
                let to: Address
                let value: bigint
                let data: Hex
                let operationType = 0

                if (Array.isArray(args)) {
                    const argsArray = args as {
                        to: Address
                        value: bigint
                        data: Hex
                    }[]

                    to = multiSendCallOnlyAddress
                    value = BigInt(0)

                    data = encodeMultiSend(
                        argsArray.map((tx) => ({ ...tx, operation: 0 }))
                    )
                    operationType = 1
                } else {
                    const singleTransaction = args as {
                        to: Address
                        value: bigint
                        data: Hex
                    }
                    to = singleTransaction.to
                    data = singleTransaction.data
                    value = singleTransaction.value
                }

                return encodeFunctionData({
                    abi: [
                        {
                            inputs: [
                                {
                                    internalType: "address",
                                    name: "to",
                                    type: "address"
                                },
                                {
                                    internalType: "uint256",
                                    name: "value",
                                    type: "uint256"
                                },
                                {
                                    internalType: "bytes",
                                    name: "data",
                                    type: "bytes"
                                },
                                {
                                    internalType: "uint8",
                                    name: "operation",
                                    type: "uint8"
                                }
                            ],
                            name: "executeUserOpWithErrorString",
                            outputs: [],
                            stateMutability: "nonpayable",
                            type: "function"
                        }
                    ],
                    functionName: "executeUserOpWithErrorString",
                    args: [to, value, data, operationType]
                })
            },
            async getDummySignature(_userOperation) {
                return "0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            }
        })

    return safeSmartAccount
}
