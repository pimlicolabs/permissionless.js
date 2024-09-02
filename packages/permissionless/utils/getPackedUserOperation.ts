import { type Hex, concat, getAddress, pad, slice, toHex } from "viem"
import type {
    PackedUserOperation,
    UserOperation
} from "viem/account-abstraction"

export function getInitCode(unpackedUserOperation: UserOperation<"0.7">) {
    return unpackedUserOperation.factory
        ? concat([
              unpackedUserOperation.factory,
              unpackedUserOperation.factoryData || ("0x" as Hex)
          ])
        : "0x"
}

export function unPackInitCode(initCode: Hex) {
    if (initCode === "0x") {
        return {
            factory: null,
            factoryData: null
        }
    }
    return {
        factory: getAddress(slice(initCode, 0, 20)),
        factoryData: slice(initCode, 20)
    }
}

export function getAccountGasLimits(
    unpackedUserOperation: UserOperation<"0.7">
) {
    return concat([
        pad(toHex(unpackedUserOperation.verificationGasLimit), {
            size: 16
        }),
        pad(toHex(unpackedUserOperation.callGasLimit), { size: 16 })
    ])
}

export function unpackAccountGasLimits(accountGasLimits: Hex) {
    return {
        verificationGasLimit: BigInt(slice(accountGasLimits, 0, 16)),
        callGasLimit: BigInt(slice(accountGasLimits, 16))
    }
}

export function getGasLimits(unpackedUserOperation: UserOperation<"0.7">) {
    return concat([
        pad(toHex(unpackedUserOperation.maxPriorityFeePerGas), {
            size: 16
        }),
        pad(toHex(unpackedUserOperation.maxFeePerGas), { size: 16 })
    ])
}

export function unpackGasLimits(gasLimits: Hex) {
    return {
        maxPriorityFeePerGas: BigInt(slice(gasLimits, 0, 16)),
        maxFeePerGas: BigInt(slice(gasLimits, 16))
    }
}

export function getPaymasterAndData(
    unpackedUserOperation: UserOperation<"0.7">
) {
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

export function unpackPaymasterAndData(paymasterAndData: Hex) {
    if (paymasterAndData === "0x") {
        return {
            paymaster: null,
            paymasterVerificationGasLimit: null,
            paymasterPostOpGasLimit: null,
            paymasterData: null
        }
    }
    return {
        paymaster: getAddress(slice(paymasterAndData, 0, 20)),
        paymasterVerificationGasLimit: BigInt(slice(paymasterAndData, 20, 36)),
        paymasterPostOpGasLimit: BigInt(slice(paymasterAndData, 36, 52)),
        paymasterData: slice(paymasterAndData, 52)
    }
}

export const getPackedUserOperation = (
    userOperation: UserOperation<"0.7">
): PackedUserOperation => {
    return {
        sender: userOperation.sender,
        nonce: userOperation.nonce,
        initCode: getInitCode(userOperation),
        callData: userOperation.callData,
        accountGasLimits: getAccountGasLimits(userOperation),
        preVerificationGas: userOperation.preVerificationGas,
        gasFees: getGasLimits(userOperation),
        paymasterAndData: getPaymasterAndData(userOperation),
        signature: userOperation.signature
    }
}
