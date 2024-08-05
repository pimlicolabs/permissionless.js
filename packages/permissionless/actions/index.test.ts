import type {
    Account,
    Address,
    Chain,
    Client,
    Hash,
    Hex,
    Log,
    Transport
} from "viem"
import type { PartialBy } from "viem/chains"
import { describe, expectTypeOf, test } from "vitest"
import type { BundlerRpcSchema } from "../types/bundler"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    EntryPoint
} from "../types/entrypoint"
import type { TStatus, UserOperation } from "../types/userOperation"
import {
    chainId,
    estimateUserOperationGas,
    getAccountNonce,
    getSenderAddress,
    getUserOperationByHash,
    getUserOperationReceipt,
    sendUserOperation,
    supportedEntryPoints,
    waitForUserOperationReceipt
} from "./index"

describe("index", () => {
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
        expectTypeOf(sendUserOperation).parameter(1).toMatchTypeOf<{
            userOperation: UserOperation<"v0.6" | "v0.7">
            entryPoint: EntryPoint
        }>()
        expectTypeOf(sendUserOperation).returns.toMatchTypeOf<Promise<Hex>>()
    })

    test("estimateUserOperationGas", () => {
        expectTypeOf(estimateUserOperationGas).toBeFunction()
        expectTypeOf(estimateUserOperationGas)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()

        expectTypeOf(estimateUserOperationGas).parameter(1).toMatchTypeOf<{
            userOperation:
                | PartialBy<
                      UserOperation<"v0.6">,
                      | "callGasLimit"
                      | "preVerificationGas"
                      | "verificationGasLimit"
                  >
                | PartialBy<
                      UserOperation<"v0.7">,
                      | "callGasLimit"
                      | "preVerificationGas"
                      | "verificationGasLimit"
                      | "paymasterVerificationGasLimit"
                      | "paymasterPostOpGasLimit"
                  >
            entryPoint: EntryPoint
        }>()
        expectTypeOf(estimateUserOperationGas).parameter(2).toMatchTypeOf<
            | {
                  [x: string]: {
                      balance?: bigint | undefined
                      nonce?: bigint | number | undefined
                      code?: Hex | undefined
                      state?: {
                          [x: Hex]: Hex
                      }
                      stateDiff?: {
                          [x: Hex]: Hex
                      }
                  }
              }
            | undefined
        >()
        expectTypeOf(
            estimateUserOperationGas<ENTRYPOINT_ADDRESS_V06_TYPE>
        ).returns.toMatchTypeOf<
            Promise<{
                preVerificationGas: bigint
                verificationGasLimit: bigint
                callGasLimit: bigint
            }>
        >()
        expectTypeOf(
            estimateUserOperationGas<ENTRYPOINT_ADDRESS_V07_TYPE>
        ).returns.toMatchTypeOf<
            Promise<{
                preVerificationGas: bigint
                verificationGasLimit: bigint
                callGasLimit: bigint
                paymasterVerificationGasLimit?: bigint
                paymasterPostOpGasLimit?: bigint
            }>
        >()
    })

    test("supportedEntryPoints", () => {
        expectTypeOf(supportedEntryPoints)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()

        expectTypeOf(supportedEntryPoints).returns.toMatchTypeOf<
            Promise<EntryPoint[]>
        >()
    })

    test("chainId", () => {
        expectTypeOf(chainId)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()

        expectTypeOf(chainId).returns.toMatchTypeOf<Promise<number>>()
    })

    test("getUserOperationByHash", () => {
        expectTypeOf(getUserOperationByHash)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(getUserOperationByHash).parameter(1).toMatchTypeOf<{
            hash: Hash
        }>()
        expectTypeOf(
            getUserOperationByHash<ENTRYPOINT_ADDRESS_V06_TYPE>
        ).returns.toMatchTypeOf<
            Promise<{
                userOperation: UserOperation<"v0.6">
                entryPoint: Address
                transactionHash: Hash
                blockHash: Hash
                blockNumber: bigint
            } | null>
        >()
        expectTypeOf(
            getUserOperationByHash<ENTRYPOINT_ADDRESS_V07_TYPE>
        ).returns.toMatchTypeOf<
            Promise<{
                userOperation: UserOperation<"v0.7">
                entryPoint: Address
                transactionHash: Hash
                blockHash: Hash
                blockNumber: bigint
            } | null>
        >()
    })

    test("getUserOperationReceipt", () => {
        expectTypeOf(getUserOperationReceipt)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(getUserOperationReceipt).parameter(1).toMatchTypeOf<{
            hash: Hash
        }>()
        expectTypeOf(getUserOperationReceipt).returns.toMatchTypeOf<
            Promise<{
                userOpHash: Hash
                entryPoint: Address
                sender: Address
                nonce: bigint
                paymaster?: Address
                actualGasUsed: bigint
                actualGasCost: bigint
                success: boolean
                reason?: string
                receipt: {
                    transactionHash: Hex
                    transactionIndex: bigint
                    blockHash: Hash
                    blockNumber: bigint
                    from: Address
                    to: Address | null
                    cumulativeGasUsed: bigint
                    status: TStatus
                    gasUsed: bigint
                    contractAddress: Address | null
                    logsBloom: Hex
                    effectiveGasPrice: bigint | null
                    gasPrice: bigint | null
                }
                logs: Log[]
            } | null>
        >()
    })

    test("getSenderAddress", () => {
        expectTypeOf(getSenderAddress)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(getSenderAddress<ENTRYPOINT_ADDRESS_V06_TYPE>)
            .parameter(1)
            .toMatchTypeOf<{
                initCode: Hex
                entryPoint: ENTRYPOINT_ADDRESS_V06_TYPE
                factory?: never
                factoryData?: never
            }>()
        expectTypeOf(getSenderAddress<ENTRYPOINT_ADDRESS_V07_TYPE>)
            .parameter(1)
            .toMatchTypeOf<{
                entryPoint: ENTRYPOINT_ADDRESS_V07_TYPE
                factory: Address
                factoryData: Hex
                initCode?: never
            }>()
        expectTypeOf(getSenderAddress).returns.toMatchTypeOf<Promise<Address>>()
    })

    test("getAccountNonce", () => {
        expectTypeOf(getAccountNonce)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(getAccountNonce).parameter(1).toMatchTypeOf<{
            sender: Address
            entryPoint: EntryPoint
            key?: bigint
        }>()
        expectTypeOf(getAccountNonce).returns.toMatchTypeOf<Promise<bigint>>()
    })

    test("waitForUserOperationReceipt", () => {
        expectTypeOf(waitForUserOperationReceipt)
            .parameter(0)
            .toMatchTypeOf<
                Client<
                    Transport,
                    Chain | undefined,
                    Account | undefined,
                    BundlerRpcSchema<EntryPoint>
                >
            >()
        expectTypeOf(waitForUserOperationReceipt).parameter(1).toMatchTypeOf<{
            hash: Hash
            pollingInterval?: number
            timeout?: number
        }>()
        expectTypeOf(waitForUserOperationReceipt).returns.toMatchTypeOf<
            Promise<{
                userOpHash: Hash
                entryPoint: Address
                sender: Address
                nonce: bigint
                paymaster?: Address
                actualGasUsed: bigint
                actualGasCost: bigint
                success: boolean
                reason?: string
                receipt: {
                    transactionHash: Hex
                    transactionIndex: bigint
                    blockHash: Hash
                    blockNumber: bigint
                    from: Address
                    to: Address | null
                    cumulativeGasUsed: bigint
                    status: TStatus
                    gasUsed: bigint
                    contractAddress: Address | null
                    logsBloom: Hex
                    effectiveGasPrice: bigint | null
                    gasPrice: bigint | null
                }
                logs: Log[]
            }>
        >()
    })
})
