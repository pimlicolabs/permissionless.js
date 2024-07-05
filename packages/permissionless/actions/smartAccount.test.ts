import type {
    Abi,
    Account,
    Address,
    Chain,
    Client,
    Hash,
    Hex,
    SignTypedDataParameters,
    Transport,
    TypedData
} from "viem"
import type { SignMessageParameters } from "viem"
import { describe, expectTypeOf, test } from "vitest"
import type { SmartAccount } from "../accounts"
import type { BundlerRpcSchema } from "../types/bundler"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    EntryPoint
} from "../types/entrypoint"
import {
    type DeployContractParametersWithPaymaster,
    type PrepareUserOperationRequestParameters,
    type PrepareUserOperationRequestReturnType,
    type SendTransactionWithPaymasterParameters,
    type SendTransactionsWithPaymasterParameters,
    type SendUserOperationParameters,
    type WriteContractWithPaymasterParameters,
    deployContract,
    prepareUserOperationRequest,
    sendTransaction,
    sendTransactions,
    sendUserOperation,
    signMessage,
    signTypedData,
    writeContract
} from "./smartAccount"

describe("index", () => {
    test("sendUserOperation", () => {
        expectTypeOf(deployContract).toBeFunction()
        expectTypeOf(deployContract)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(deployContract)
            .parameter(1)
            .toMatchTypeOf<DeployContractParametersWithPaymaster<EntryPoint>>()
        expectTypeOf(deployContract).returns.toMatchTypeOf<Promise<Hash>>()
    })
    test("prepareUserOperationRequest", () => {
        expectTypeOf(prepareUserOperationRequest).toBeFunction()
        expectTypeOf(prepareUserOperationRequest)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(prepareUserOperationRequest)
            .parameter(1)
            .toMatchTypeOf<PrepareUserOperationRequestParameters<EntryPoint>>()
        expectTypeOf(prepareUserOperationRequest).returns.toMatchTypeOf<
            Promise<PrepareUserOperationRequestReturnType<EntryPoint>>
        >()
    })
    test("sendTransaction", () => {
        expectTypeOf(sendTransaction).toBeFunction()
        expectTypeOf(sendTransaction)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(sendTransaction)
            .parameter(1)
            .toMatchTypeOf<SendTransactionWithPaymasterParameters<EntryPoint>>()
        expectTypeOf(sendTransaction).returns.toMatchTypeOf<Promise<Hex>>()
    })
    test("sendTransactions", () => {
        expectTypeOf(sendTransactions).toBeFunction()
        expectTypeOf(sendTransactions)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(sendTransactions)
            .parameter(1)
            .toMatchTypeOf<
                SendTransactionsWithPaymasterParameters<EntryPoint>
            >()
        expectTypeOf(sendTransactions).returns.toMatchTypeOf<Promise<Hex>>()
    })
    test("writeContract", () => {
        expectTypeOf(writeContract).toBeFunction()
        expectTypeOf(writeContract)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(
            writeContract<
                ENTRYPOINT_ADDRESS_V06_TYPE,
                Chain,
                SmartAccount<ENTRYPOINT_ADDRESS_V06_TYPE>,
                Abi
            >
        )
            .parameter(1)
            .toMatchTypeOf<
                WriteContractWithPaymasterParameters<
                    ENTRYPOINT_ADDRESS_V06_TYPE,
                    Chain,
                    SmartAccount<ENTRYPOINT_ADDRESS_V06_TYPE>,
                    Abi
                >
            >()
        expectTypeOf(writeContract).returns.toMatchTypeOf<Promise<Hex>>()
    })
    test("sendUserOperation", () => {
        expectTypeOf(sendUserOperation).toBeFunction()
        expectTypeOf(sendUserOperation)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(sendUserOperation)
            .parameter(1)
            .toMatchTypeOf<SendUserOperationParameters<EntryPoint>>()
        expectTypeOf(sendUserOperation).returns.toMatchTypeOf<Promise<Hex>>()
    })
    test("signMessage", () => {
        expectTypeOf(signMessage).toBeFunction()
        expectTypeOf(signMessage)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(signMessage)
            .parameter(1)
            .toMatchTypeOf<SignMessageParameters<SmartAccount<EntryPoint>>>()
        expectTypeOf(signMessage).returns.toMatchTypeOf<Promise<Hex>>()
    })
    test("signTypedData", () => {
        expectTypeOf(signTypedData).toBeFunction()
        expectTypeOf(signTypedData)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(
            signTypedData<EntryPoint, TypedData, string, undefined, undefined>
        )
            .parameter(1)
            .toMatchTypeOf<
                SignTypedDataParameters<TypedData, string, undefined>
            >()
        expectTypeOf(signTypedData).returns.toMatchTypeOf<Promise<Hex>>()
    })
})
