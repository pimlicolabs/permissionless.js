import { Signature } from "ox"
import {
    type Account,
    type Address,
    type Chain,
    type Hex,
    type LocalAccount,
    type OneOf,
    type Transport,
    type UnionPartialBy,
    type WalletClient,
    concatHex,
    decodeAbiParameters,
    encodeAbiParameters,
    encodePacked,
    hashTypedData
} from "viem"
import type { UserOperation, WebAuthnAccount } from "viem/account-abstraction"
import { toOwner } from "../../utils/index.js"
import type { EthereumProvider } from "../../utils/toOwner.js"
import {
    EIP712_SAFE_OPERATION_TYPE_V06,
    EIP712_SAFE_OPERATION_TYPE_V07,
    type SafeVersion,
    getDefaultAddresses,
    getPaymasterAndData,
    isWebAuthnAccount
} from "./toSafeSmartAccount.js"

export const concatSignatures = (
    signatures: { signer: Address; data: Hex; dynamic: boolean }[]
) => {
    signatures.sort((left, right) =>
        left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
    )

    const SIGNATURE_LENGTH_BYTES = 65
    let signatureBytes = "0x"
    let dynamicBytes = ""

    for (const sig of signatures) {
        if (sig.dynamic) {
            /*
                A contract signature has a static part of 65 bytes and the dynamic part that needs to be appended
                at the end of signature bytes.
                The signature format is
                Signature type == 0
                Constant part: 65 bytes
                {32-bytes signature verifier}{32-bytes dynamic data position}{1-byte signature type}
                Dynamic part (solidity bytes): 32 bytes + signature data length
                {32-bytes signature length}{bytes signature data}
            */
            const dynamicPartPosition = (
                signatures.length * SIGNATURE_LENGTH_BYTES +
                dynamicBytes.length / 2
            )
                .toString(16)
                .padStart(64, "0")
            const dynamicPartLength = (sig.data.slice(2).length / 2)
                .toString(16)
                .padStart(64, "0")
            const staticSignature = `${sig.signer.slice(2).padStart(64, "0")}${dynamicPartPosition}00`
            const dynamicPartWithLength = `${dynamicPartLength}${sig.data.slice(2)}`
            signatureBytes += staticSignature
            dynamicBytes += dynamicPartWithLength
        } else {
            signatureBytes += sig.data.slice(2)
        }
    }

    signatureBytes += dynamicBytes

    return signatureBytes as Hex
}

export const getWebAuthnSignature = async ({
    owner,
    hash
}: {
    owner: WebAuthnAccount
    hash: Hex
}) => {
    const { signature: signatureData, webauthn } = await owner.sign({
        hash
    })

    const signature = Signature.fromHex(signatureData)

    const match = webauthn.clientDataJSON.match(
        /^\{"type":"webauthn.get","challenge":"[A-Za-z0-9\-_]{43}",(.*)\}$/
    )

    if (!match) {
        throw new Error("challenge not found in client data JSON")
    }

    const [, fields] = match

    return encodeAbiParameters(
        [
            { name: "authenticatorData", type: "bytes" },
            { name: "clientDataJSON", type: "string" },
            { name: "signature", type: "uint256[2]" }
        ],
        [
            webauthn.authenticatorData,
            fields,
            [BigInt(signature.r), BigInt(signature.s)]
        ]
    )
}

export async function signUserOperation(
    parameters: UnionPartialBy<UserOperation, "sender"> & {
        version: SafeVersion
        entryPoint: {
            address: Address
            version: "0.6" | "0.7"
        }
        owners: (Account | WebAuthnAccount)[]
        account: OneOf<
            | EthereumProvider
            | WalletClient<Transport, Chain | undefined, Account>
            | LocalAccount
            | WebAuthnAccount
        >
        chainId: number
        signatures?: Hex
        validAfter?: number
        validUntil?: number
        safe4337ModuleAddress?: Address
        safeWebAuthnSharedSignerAddress?: Address
    }
) {
    const {
        chainId,
        entryPoint,
        validAfter = 0,
        validUntil = 0,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        version,
        owners,
        signatures: existingSignatures,
        account,
        ...userOperation
    } = parameters

    const { safe4337ModuleAddress } = getDefaultAddresses(
        version,
        entryPoint.version,
        {
            safe4337ModuleAddress: _safe4337ModuleAddress
        }
    )

    const message = {
        safe: userOperation.sender,
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
        entryPoint: entryPoint.address
    }

    if ("initCode" in userOperation) {
        message.paymasterAndData = userOperation.paymasterAndData ?? "0x"
    }

    if ("factory" in userOperation) {
        if (userOperation.factory && userOperation.factoryData) {
            message.initCode = concatHex([
                userOperation.factory,
                userOperation.factoryData
            ])
        }
        if (!userOperation.sender) {
            throw new Error("Sender is required")
        }
        message.paymasterAndData = getPaymasterAndData({
            ...userOperation,
            sender: userOperation.sender
        })
    }

    const localOwner = isWebAuthnAccount(account)
        ? account
        : await toOwner({
              owner: account
          })

    const signer = isWebAuthnAccount(localOwner)
        ? parameters.safeWebAuthnSharedSignerAddress
        : localOwner.address

    if (!signer) {
        throw new Error("no signer found")
    }

    let unPackedSignatures: readonly {
        signer: Address
        data: Hex
        dynamic: boolean
    }[] = []

    if (existingSignatures) {
        try {
            const decoded = decodeAbiParameters(
                [
                    {
                        components: [
                            { type: "address", name: "signer" },
                            { type: "bytes", name: "data" },
                            { type: "bool", name: "dynamic" }
                        ],
                        name: "signatures",
                        type: "tuple[]"
                    }
                ],
                existingSignatures
            )

            unPackedSignatures = decoded[0]
        } catch {
            const decoded = decodeAbiParameters(
                [
                    {
                        components: [
                            { type: "address", name: "signer" },
                            { type: "bytes", name: "data" }
                        ],
                        name: "signatures",
                        type: "tuple[]"
                    }
                ],
                existingSignatures
            )

            unPackedSignatures = decoded[0].map((sig) => ({
                ...sig,
                dynamic: false
            }))
        }
    }

    const signatures: { signer: Address; data: Hex; dynamic: boolean }[] = [
        ...unPackedSignatures,
        {
            signer,
            dynamic: isWebAuthnAccount(localOwner),
            data: await (async () => {
                if (isWebAuthnAccount(localOwner)) {
                    const safeHash = hashTypedData({
                        domain: {
                            chainId,
                            verifyingContract: safe4337ModuleAddress
                        },
                        types:
                            entryPoint.version === "0.6"
                                ? EIP712_SAFE_OPERATION_TYPE_V06
                                : EIP712_SAFE_OPERATION_TYPE_V07,
                        primaryType: "SafeOp",
                        message: message
                    })

                    return getWebAuthnSignature({
                        owner: localOwner,
                        hash: safeHash
                    })
                }

                return localOwner.signTypedData({
                    domain: {
                        chainId,
                        verifyingContract: safe4337ModuleAddress
                    },
                    types:
                        entryPoint.version === "0.6"
                            ? EIP712_SAFE_OPERATION_TYPE_V06
                            : EIP712_SAFE_OPERATION_TYPE_V07,
                    primaryType: "SafeOp",
                    message: message
                })
            })()
        }
    ]

    if (signatures.length !== owners.length) {
        return encodeAbiParameters(
            [
                {
                    components: [
                        { type: "address", name: "signer" },
                        { type: "bytes", name: "data" },
                        { type: "bool", name: "dynamic" }
                    ],
                    name: "signatures",
                    type: "tuple[]"
                }
            ],
            [signatures]
        )
    }

    return encodePacked(
        ["uint48", "uint48", "bytes"],
        [validAfter, validUntil, concatSignatures(signatures)]
    )
}
