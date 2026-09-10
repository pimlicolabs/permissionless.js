import { Contract } from "viem"
import { UserOperation } from "viem/erc4337"
import { AbiParameters, type Address, Hex } from "viem/utils"
import { constants } from "./constants.js"
import {
    singletonPaymaster06Abi,
    singletonPaymaster07Abi
} from "./helpers/abi.js"
import type {
    PaymasterMode,
    PublicClient,
    WalletClient
} from "./helpers/utils.js"

export const getDummyPaymasterData = ({
    is06,
    paymaster,
    paymasterMode
}: {
    is06: boolean
    paymaster: Address.Address
    paymasterMode: PaymasterMode
}):
    | { paymaster: Address.Address; paymasterData: Hex.Hex }
    | { paymasterAndData: Hex.Hex } => {
    let encodedDummyData: Hex.Hex

    const validUntil = 0
    const validAfter = 0
    const paymasterValidationGasLimit = 1n
    const mode = paymasterMode.mode === "verifying" ? 0 : 1

    const allowAllBundlers = true
    const modeAndAllowBundlers = (mode << 1) | (allowAllBundlers ? 1 : 0)

    if (paymasterMode.mode === "verifying") {
        encodedDummyData = AbiParameters.encodePacked(
            [
                "uint8", // mode and allowAllBundler
                "uint48", // validUntil
                "uint48", // validAfter
                "bytes" // signature
            ],
            [
                modeAndAllowBundlers,
                validUntil,
                validAfter,
                constants.dummySignature
            ]
        )
    } else {
        encodedDummyData = AbiParameters.encodePacked(
            [
                "uint8", // combined byte (mode and allowAllBundlers)
                "uint8", // constantFeePresent and recipientPresent and preFundPresent (1 byte) - 0000{preFundPresent bit}{recipientPresent bit}{constantFeePresent bit}
                "uint48", // validUntil
                "uint48", // validAfter
                "address", // token address
                "uint128", // postOpGas
                "uint256", // exchangeRate
                "uint128", // paymasterValidationGasLimit
                "address" // treasury
            ],
            [
                modeAndAllowBundlers,
                0,
                validUntil,
                validAfter,
                paymasterMode.token,
                constants.postOpGasOverhead,
                constants.exchangeRate,
                paymasterValidationGasLimit,
                constants.treasury
            ]
        )

        encodedDummyData = AbiParameters.encodePacked(
            ["bytes", "bytes"],
            [encodedDummyData, constants.dummySignature]
        )
    }

    if (is06) {
        return {
            paymasterAndData: Hex.concat(paymaster, encodedDummyData)
        }
    }

    return {
        paymaster,
        paymasterData: encodedDummyData
    }
}

export const getSignedPaymasterData: (params: {
    publicClient: PublicClient
    signer: WalletClient
    userOp: UserOperation.UserOperation
    paymaster: Address.Address
    paymasterMode: PaymasterMode
}) => Promise<
    | { paymasterAndData: Hex.Hex }
    | { paymaster: Address.Address; paymasterData: Hex.Hex }
> = async ({ publicClient, signer, userOp, paymaster, paymasterMode }) => {
    let paymasterData: Hex.Hex

    const validAfter = 0
    const validUntil = Math.floor(Date.now() / 1000) + constants.validForSeconds

    const mode = paymasterMode.mode === "verifying" ? 0 : 1
    const allowAllBundlers = true
    const modeAndAllowBundlers = (mode << 1) | (allowAllBundlers ? 1 : 0)

    if (paymasterMode.mode === "verifying") {
        paymasterData = AbiParameters.encodePacked(
            [
                "uint8", // mode and allowAllBundler
                "uint48", // validUntil
                "uint48" // validAfter
            ],
            [modeAndAllowBundlers, validUntil, validAfter]
        )
    } else {
        const paymasterValidationGasLimit = 1n

        const constantFeePresent = false
        const recipientPresent = false
        const preFundPresent = false

        const constantFeeAndRecipientAndPreFund =
            ((preFundPresent ? 1 : 0) << 2) |
            ((recipientPresent ? 1 : 0) << 1) |
            (constantFeePresent ? 1 : 0)

        paymasterData = AbiParameters.encodePacked(
            [
                "uint8", // combined byte (mode and allowAllBundlers)
                "uint8", // constantFeePresent and recipientPresent and preFundPresent (1 byte) - 0000{preFundPresent bit}{recipientPresent bit}{constantFeePresent bit}
                "uint48", // validUntil
                "uint48", // validAfter
                "address", // token address
                "uint128", // postOpGas
                "uint256", // exchangeRate
                "uint128", // paymasterValidationGasLimit
                "address" // treasury
            ],
            [
                modeAndAllowBundlers,
                constantFeeAndRecipientAndPreFund,
                validUntil,
                validAfter,
                paymasterMode.token,
                constants.postOpGasOverhead,
                constants.exchangeRate,
                paymasterValidationGasLimit,
                constants.treasury
            ]
        )
    }

    if ("initCode" in userOp && "paymasterAndData" in userOp) {
        const singletonPaymaster = Contract.from({
            address: paymaster,
            abi: singletonPaymaster06Abi,
            client: publicClient
        })

        const hash = await singletonPaymaster.read.getHash([
            mode,
            {
                sender: userOp.sender,
                nonce: userOp.nonce,
                initCode: userOp.initCode || "0x",
                callData: userOp.callData,
                callGasLimit: userOp.callGasLimit,
                verificationGasLimit: userOp.verificationGasLimit,
                preVerificationGas: userOp.preVerificationGas,
                maxFeePerGas: userOp.maxFeePerGas,
                maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
                paymasterAndData: Hex.concat(paymaster, paymasterData),
                signature: userOp.signature ?? "0x"
            }
        ])

        const sig = await signer.signMessage({
            message: { raw: hash }
        })

        return {
            paymasterAndData: Hex.concat(paymaster, paymasterData, sig)
        }
    }

    // userOperation is v07
    const singletonPaymaster = Contract.from({
        address: paymaster,
        abi: singletonPaymaster07Abi,
        client: publicClient
    })

    const hash = await singletonPaymaster.read.getHash([
        mode,
        // paymaster signs over paymasterData so we add paymaster + paymasterData
        UserOperation.toPacked({
            ...userOp,
            paymaster,
            paymasterData
        } as UserOperation.UserOperation<"0.7", true>)
    ])

    const sig = await signer.signMessage({
        message: { raw: hash }
    })

    paymasterData = AbiParameters.encodePacked(
        ["bytes", "bytes"],
        [paymasterData, sig]
    )

    return {
        paymaster,
        paymasterData
    }
}
