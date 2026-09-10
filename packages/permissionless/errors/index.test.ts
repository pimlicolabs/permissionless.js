import { Errors } from "viem"
import { describe, expect, test } from "vitest"
import * as errors from "./index"

const address = "0x0000000000000000000000000000000000000001"
const cause = new Error("cause")

const table: [
    new (...args: any[]) => Errors.BaseError<Error | undefined>,
    unknown[]
][] = [
    [errors.AccountNotFoundError, []],
    [errors.EmptyCallsError, []],
    [errors.InvalidEntryPointError, [{ cause, entryPointAddress: address }]],
    [errors.InitCodeRequiredError, []],
    [errors.SenderAddressNotFoundError, [{ entryPointAddress: address }]],
    [errors.TokenQuoteNotFoundError, [{ token: address }]],
    [errors.BalanceSlotRequiredError, [{ token: address }]],
    [errors.Erc20PaymasterRequiredError, []],
    [errors.Erc7579InvalidCallTypeError, [{ callType: "0x02" }]],
    [errors.Erc7579InvalidExecutionModeError, [{ type: "call", calls: 2 }]],
    [errors.Erc7579InvalidModuleTypeError, [{ type: "bogus" }]],
    [errors.EtherspotNonceKeyOverflowError, [{ key: 65536n }]],
    [
        errors.KernelUnsupportedVersionError,
        [{ version: "0.3.1", entryPointVersion: "0.6" }]
    ],
    [errors.KernelValidatorAddressRequiredError, [{ version: "0.2.2" }]],
    [
        errors.KernelNonceKeyTooLargeError,
        [{ nonceKey: 65536n, version: "0.3.1" }]
    ],
    [errors.KernelDecodeCallsError, [{ functionName: "foo" }]],
    [errors.InvalidKernelAccountError, [{ address, cause }]],
    [
        errors.LightSmartAccountUnsupportedVersionError,
        [{ entryPointVersion: "0.6", version: "2.0.0" }]
    ],
    [errors.OwnerAddressRequiredError, []],
    [errors.OwnerSignUnsupportedError, []],
    [
        errors.InvalidPasskeyServerResponseError,
        [{ method: "pks_getCredentials", reason: "Expected an array." }]
    ],
    [errors.InvalidPasskeyCredentialError, [{ field: "signature" }]],
    [
        errors.PasskeyAttestationUnsupportedError,
        [{ method: "getAuthenticatorData", cause }]
    ],
    [
        errors.SafeEntryPointVersionUnsupportedError,
        [{ version: "1.4.1", entryPointVersion: "0.8" }]
    ],
    [errors.SafeWebAuthnSharedSignerAddressMissingError, []],
    [errors.SafeInvalidOwnerError, []],
    [errors.SafeInsufficientOwnersError, [{ owners: 1, threshold: 2n }]],
    [errors.SafeErc7579VersionUnsupportedError, [{ version: "1.4.1" }]],
    [errors.SafeSenderRequiredError, []],
    [errors.SafeInvalidWebAuthnClientDataError, []],
    [errors.SafeInvalidSignatureError, [{ v: 5 }]],
    [errors.SimpleAccountErc1271UnsupportedError, []],
    [
        errors.SimpleAccountFactoryAddressRequiredError,
        [{ entryPointVersion: "0.9" }]
    ],
    [errors.TransactionToRequiredError, []],
    [errors.TrustInvalidCallDataError, [{ selector: "0xdeadbeef" }]]
]

describe("errors", () => {
    test.each(table)("%o is a viem BaseError", (Cls, args) => {
        const error = new Cls(...args)
        expect(error).toBeInstanceOf(Errors.BaseError)
        expect(error).toBeInstanceOf(Cls)
        expect(error.name).toBe(Cls.name)
        expect(error.message.split("\n")[0]).not.toBe("")
    })

    test("the table covers every class exported from the root", () => {
        expect(table.map(([Cls]) => Cls.name).sort()).toEqual(
            Object.keys(errors)
                .filter((key) => key.endsWith("Error"))
                .sort()
        )
    })
})
