import type { UserOperation } from "permissionless"
import { type Hex, concat, pad, toHex, createWalletClient, http } from "viem"
import { foundry } from "viem/chains"
import { mnemonicToAccount } from "viem/accounts"

function getInitCode(unpackedUserOperation: UserOperation<"v0.7">) {
    return unpackedUserOperation.factory
        ? concat([
            unpackedUserOperation.factory,
            unpackedUserOperation.factoryData || ("0x" as Hex)
        ])
        : "0x"
}

export function getAccountGasLimits(
    unpackedUserOperation: UserOperation<"v0.7">
) {
    return concat([
        pad(toHex(unpackedUserOperation.verificationGasLimit), {
            size: 16
        }),
        pad(toHex(unpackedUserOperation.callGasLimit), { size: 16 })
    ])
}

export function getGasLimits(unpackedUserOperation: UserOperation<"v0.7">) {
    return concat([
        pad(toHex(unpackedUserOperation.maxPriorityFeePerGas), {
            size: 16
        }),
        pad(toHex(unpackedUserOperation.maxFeePerGas), { size: 16 })
    ])
}

export function getPaymasterAndData(
    unpackedUserOperation: UserOperation<"v0.7">
) {
    return unpackedUserOperation.paymaster
        ? concat([
            unpackedUserOperation.paymaster,
            pad(
                toHex(
                    unpackedUserOperation.paymasterVerificationGasLimit || 0n
                ),
                {
                    size: 16
                }
            ),
            pad(toHex(unpackedUserOperation.paymasterPostOpGasLimit || 0n), {
                size: 16
            }),
            unpackedUserOperation.paymasterData || ("0x" as Hex)
        ])
        : "0x"
}

export function toPackedUserOperation(
    unpackedUserOperation: UserOperation<"v0.7">
) {
    return {
        sender: unpackedUserOperation.sender,
        nonce: unpackedUserOperation.nonce,
        initCode: getInitCode(unpackedUserOperation),
        callData: unpackedUserOperation.callData,
        accountGasLimits: getAccountGasLimits(unpackedUserOperation),
        preVerificationGas: unpackedUserOperation.preVerificationGas,
        gasFees: getGasLimits(unpackedUserOperation),
        paymasterAndData: getPaymasterAndData(unpackedUserOperation),
        signature: unpackedUserOperation.signature
    }
}

export const getAnvilWalletClient = () => {
    const account = mnemonicToAccount(
        "test test test test test test test test test test test junk",
        {
            /* avoid nonce error with index 0 when deploying ep contracts. */
            addressIndex: 1
        }
    )

    const walletClient = createWalletClient({
        account,
        chain: foundry,
        transport: http(process.env.ANVIL_RPC)
    })

    return walletClient
}
