import type { Account, Chain, Client } from "viem"
import type { UserOperation, WebAuthnAccount } from "viem/erc4337"
import {
    AbiParameters,
    type Address,
    Hex,
    Signature,
    TypedData
} from "viem/utils"
import {
    SafeInvalidWebAuthnClientDataError,
    SafeSenderRequiredError,
    SafeWebAuthnSharedSignerAddressMissingError
} from "../../errors/safe.js"
import type { OneOf } from "../../types/utils.js"
import {
    type EntryPointParameter,
    toEntryPoint
} from "../../utils/toEntryPoint.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"
import {
    EIP712_SAFE_OPERATION_TYPE_V06,
    EIP712_SAFE_OPERATION_TYPE_V07,
    type EntryPointVersion,
    getDefaultAddresses,
    getPaymasterAndData,
    isWebAuthnAccount,
    type Version
} from "./from.js"

type OwnerSignature = {
    signer: Address.Address
    data: Hex.Hex
    dynamic: boolean
}

const signaturesAbi = [
    {
        components: [
            { type: "address", name: "signer" },
            { type: "bytes", name: "data" },
            { type: "bool", name: "dynamic" }
        ],
        name: "signatures",
        type: "tuple[]"
    }
] as const

const legacySignaturesAbi = [
    {
        components: [
            { type: "address", name: "signer" },
            { type: "bytes", name: "data" }
        ],
        name: "signatures",
        type: "tuple[]"
    }
] as const

export const concatSignatures = (signatures: OwnerSignature[]) => {
    signatures.sort((left, right) => {
        const leftSigner = left.signer.toLowerCase()
        const rightSigner = right.signer.toLowerCase()
        if (leftSigner < rightSigner) {
            return -1
        }
        if (leftSigner > rightSigner) {
            return 1
        }
        return 0
    })

    const SIGNATURE_LENGTH_BYTES = 65
    let signatureBytes = "0x"
    let dynamicBytes = ""

    for (const sig of signatures) {
        if (sig.dynamic) {
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

    return signatureBytes as Hex.Hex
}

export const getWebAuthnSignature = async ({
    owner,
    hash
}: {
    owner: WebAuthnAccount.Account
    hash: Hex.Hex
}) => {
    const { signature: signatureData, webauthn } = await owner.sign({ hash })

    const signature = Signature.fromHex(signatureData)

    const match = webauthn.clientDataJSON.match(
        /^\{"type":"webauthn.get","challenge":"[A-Za-z0-9\-_]{43}",(.*)\}$/
    )

    const fields = match?.[1]

    if (fields === undefined) {
        throw new SafeInvalidWebAuthnClientDataError()
    }

    return AbiParameters.encode(
        [
            { name: "authenticatorData", type: "bytes" },
            { name: "clientDataJSON", type: "string" },
            { name: "signature", type: "uint256[2]" }
        ],
        [
            webauthn.authenticatorData,
            fields,
            [Hex.toBigInt(signature.r), Hex.toBigInt(signature.s)]
        ]
    )
}

type WalletClient = Client.Client<Chain.Chain | undefined, Account.Account>

export type SignUserOperationParameters = Omit<
    UserOperation.UserOperation<"0.7">,
    "sender"
> &
    Pick<
        UserOperation.UserOperation<"0.6">,
        "initCode" | "paymasterAndData"
    > & {
        sender?: Address.Address | undefined
        version?: Version | undefined
        entryPoint?: EntryPointParameter<EntryPointVersion> | undefined
        owners: readonly (Account.Account | WebAuthnAccount.Account)[]
        account: OneOf<
            | EthereumProvider
            | WalletClient
            | Account.Local
            | WebAuthnAccount.Account
        >
        chainId: number
        signatures?: Hex.Hex | undefined
        validAfter?: number | undefined
        validUntil?: number | undefined
        safe4337ModuleAddress?: Address.Address | undefined
        safeWebAuthnSharedSignerAddress?: Address.Address | undefined
    }

export async function signUserOperation(
    parameters: SignUserOperationParameters
): Promise<Hex.Hex> {
    const {
        chainId,
        entryPoint: _entryPoint = "0.7",
        version = "1.4.1",
        validAfter = 0,
        validUntil = 0,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeWebAuthnSharedSignerAddress: _safeWebAuthnSharedSignerAddress,
        owners,
        signatures: existingSignatures,
        account,
        ...userOperation
    } = parameters

    const entryPoint = toEntryPoint(_entryPoint)

    const { safe4337ModuleAddress, safeWebAuthnSharedSignerAddress } =
        getDefaultAddresses(version, entryPoint.version, {
            safe4337ModuleAddress: _safe4337ModuleAddress,
            safeWebAuthnSharedSignerAddress: _safeWebAuthnSharedSignerAddress
        })

    if (!userOperation.sender) {
        throw new SafeSenderRequiredError()
    }

    const typedData: TypedData.Definition = {
        domain: {
            chainId,
            verifyingContract: safe4337ModuleAddress
        },
        types:
            entryPoint.version === "0.6"
                ? EIP712_SAFE_OPERATION_TYPE_V06
                : EIP712_SAFE_OPERATION_TYPE_V07,
        primaryType: "SafeOp",
        message: {
            safe: userOperation.sender,
            callData: userOperation.callData,
            nonce: userOperation.nonce,
            initCode:
                userOperation.initCode ??
                (userOperation.factory && userOperation.factoryData
                    ? Hex.concat(
                          userOperation.factory,
                          userOperation.factoryData
                      )
                    : "0x"),
            maxFeePerGas: userOperation.maxFeePerGas,
            maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
            preVerificationGas: userOperation.preVerificationGas,
            verificationGasLimit: userOperation.verificationGasLimit,
            callGasLimit: userOperation.callGasLimit,
            paymasterAndData:
                userOperation.paymasterAndData ??
                getPaymasterAndData(userOperation),
            validAfter,
            validUntil,
            entryPoint: entryPoint.address
        }
    }

    const localOwner = isWebAuthnAccount(account)
        ? account
        : await toOwner({
              owner: account as OneOf<
                  EthereumProvider | WalletClient | Account.Local
              >
          })

    const signer = isWebAuthnAccount(localOwner)
        ? safeWebAuthnSharedSignerAddress
        : localOwner.address

    if (!signer) {
        throw new SafeWebAuthnSharedSignerAddressMissingError()
    }

    let unpackedSignatures: readonly OwnerSignature[] = []

    if (existingSignatures) {
        try {
            ;[unpackedSignatures] = AbiParameters.decode(
                signaturesAbi,
                existingSignatures
            )
        } catch {
            const [decoded] = AbiParameters.decode(
                legacySignaturesAbi,
                existingSignatures
            )
            unpackedSignatures = decoded.map((sig) => ({
                ...sig,
                dynamic: false
            }))
        }
    }

    const signatures: OwnerSignature[] = [
        ...unpackedSignatures,
        {
            signer,
            dynamic: isWebAuthnAccount(localOwner),
            data: isWebAuthnAccount(localOwner)
                ? await getWebAuthnSignature({
                      owner: localOwner,
                      hash: TypedData.getSignPayload(typedData)
                  })
                : await localOwner.signTypedData(typedData)
        }
    ]

    if (signatures.length !== owners.length) {
        return AbiParameters.encode(signaturesAbi, [signatures])
    }

    return AbiParameters.encodePacked(
        ["uint48", "uint48", "bytes"],
        [validAfter, validUntil, concatSignatures(signatures)]
    )
}
