import {
    concat,
    concatHex,
    type UnionPartialBy,
    encodePacked,
    type Address,
    type Account,
    type OneOf,
    type LocalAccount,
    type Hex,
    encodeAbiParameters,
    decodeAbiParameters
} from "viem"
import type { UserOperation } from "viem/account-abstraction"
import {
    EIP712_SAFE_OPERATION_TYPE_V06,
    EIP712_SAFE_OPERATION_TYPE_V07,
    getDefaultAddresses,
    getPaymasterAndData,
    type SafeVersion
} from "./toSafeSmartAccount.js"
import { toOwner } from "../../utils/index.js"
import type { EthereumProvider } from "../../utils/toOwner.js"

export async function signUserOperation(
    parameters: UnionPartialBy<UserOperation, "sender"> & {
        version: SafeVersion
        entryPoint: {
            address: Address
            version: "0.6" | "0.7"
        }
        owners: Account[]
        chainId: number
        signatures?: Hex
        validAfter?: number
        validUntil?: number
        safe4337ModuleAddress?: Address
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

    const localOwners = await Promise.all(
        owners
            .filter((owner) => {
                if ("type" in owner && owner.type === "local") {
                    return true
                }

                if ("request" in owner) {
                    return true
                }

                return false
            })
            .map((owner) =>
                toOwner({
                    owner: owner as OneOf<LocalAccount | EthereumProvider>
                })
            )
    )

    let unPackedSignatures: readonly { signer: Address; data: Hex }[] = []

    if (existingSignatures) {
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

        unPackedSignatures = decoded[0]
    }

    const signatures: { signer: Address; data: Hex }[] = [
        ...unPackedSignatures,
        ...(await Promise.all(
            localOwners.map(async (localOwner) => ({
                signer: localOwner.address,
                data: await localOwner.signTypedData({
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
            }))
        ))
    ]

    if (signatures.length !== owners.length) {
        return encodeAbiParameters(
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
            [signatures]
        )
    }

    signatures.sort((left, right) =>
        left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
    )
    const signatureBytes = concat(signatures.map((sig) => sig.data))

    return encodePacked(
        ["uint48", "uint48", "bytes"],
        [validAfter, validUntil, signatureBytes]
    )
}
