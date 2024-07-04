import {
    type Address,
    BaseError,
    type Chain,
    type Client,
    type ContractFunctionExecutionErrorType,
    type ContractFunctionRevertedErrorType,
    type Hex,
    InvalidInputRpcError,
    RpcRequestError,
    type Transport,
    concat,
    decodeErrorResult
} from "viem"

import { simulateContract } from "viem/actions"
import { getAction } from "viem/utils"
import type { Prettify } from "../../types/"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    EntryPoint
} from "../../types/entrypoint"

export type GetSenderAddressParams<entryPoint extends EntryPoint> =
    entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE
        ? {
              initCode: Hex
              entryPoint: entryPoint
              factory?: never
              factoryData?: never
          }
        : {
              entryPoint: entryPoint
              factory: Address
              factoryData: Hex
              initCode?: never
          }

export class InvalidEntryPointError extends BaseError {
    override name = "InvalidEntryPointError"

    constructor({
        cause,
        entryPoint
    }: { cause?: BaseError; entryPoint?: Address } = {}) {
        super(
            `The entry point address (\`entryPoint\`${
                entryPoint ? ` = ${entryPoint}` : ""
            }) is not a valid entry point. getSenderAddress did not revert with a SenderAddressResult error.`,
            {
                cause
            }
        )
    }
}

/**
 * Returns the address of the account that will be deployed with the given init code.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/public-actions/getSenderAddress
 *
 * @param client {@link Client} that you created using viem's createPublicClient.
 * @param args {@link GetSenderAddressParams} initCode & entryPoint
 * @returns Sender's Address
 *
 * @example
 * import { createPublicClient } from "viem"
 * import { getSenderAddress } from "permissionless/actions"
 *
 * const publicClient = createPublicClient({
 *      chain: goerli,
 *      transport: http("https://goerli.infura.io/v3/your-infura-key")
 * })
 *
 * const senderAddress = await getSenderAddress(publicClient, {
 *      initCode,
 *      entryPoint
 * })
 *
 * // Return '0x7a88a206ba40b37a8c07a2b5688cf8b287318b63'
 */
export const getSenderAddress = async <
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain>,
    args: Prettify<GetSenderAddressParams<entryPoint>>
): Promise<Address> => {
    const { initCode, entryPoint, factory, factoryData } = args

    if (!initCode && !factory && !factoryData) {
        throw new Error(
            "Either `initCode` or `factory` and `factoryData` must be provided"
        )
    }

    try {
        await getAction(
            client,
            simulateContract,
            "simulateContract"
        )({
            address: entryPoint,
            abi: [
                {
                    inputs: [
                        {
                            internalType: "address",
                            name: "sender",
                            type: "address"
                        }
                    ],
                    name: "SenderAddressResult",
                    type: "error"
                },
                {
                    inputs: [
                        {
                            internalType: "bytes",
                            name: "initCode",
                            type: "bytes"
                        }
                    ],
                    name: "getSenderAddress",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function"
                }
            ],
            functionName: "getSenderAddress",
            args: [initCode || concat([factory as Hex, factoryData as Hex])]
        })
    } catch (e) {
        const err = e as ContractFunctionExecutionErrorType

        if (err.cause.name === "ContractFunctionRevertedError") {
            const revertError = err.cause as ContractFunctionRevertedErrorType
            const errorName = revertError.data?.errorName ?? ""
            if (
                errorName === "SenderAddressResult" &&
                revertError.data?.args &&
                revertError.data?.args[0]
            ) {
                return revertError.data?.args[0] as Address
            }
        }

        if (err.cause.name === "CallExecutionError") {
            const revertError = err.walk(
                (err) =>
                    err instanceof RpcRequestError ||
                    err instanceof InvalidInputRpcError
            )

            if (revertError instanceof RpcRequestError) {
                const hexStringRegex = /0x[a-fA-F0-9]+/
                // biome-ignore lint/suspicious/noExplicitAny:
                const match = (revertError as unknown as any).cause.data.match(
                    hexStringRegex
                )

                if (!match) {
                    throw new Error(
                        "Failed to parse revert bytes from RPC response"
                    )
                }

                const data: Hex = match[0]

                const error = decodeErrorResult({
                    abi: [
                        {
                            inputs: [
                                {
                                    internalType: "address",
                                    name: "sender",
                                    type: "address"
                                }
                            ],
                            name: "SenderAddressResult",
                            type: "error"
                        }
                    ],
                    data
                })

                return error.args[0] as Address
            }

            if (revertError instanceof InvalidInputRpcError) {
                const hexStringRegex = /0x[a-fA-F0-9]+/
                // biome-ignore lint/suspicious/noExplicitAny:
                const match = (revertError as unknown as any).cause.data.match(
                    hexStringRegex
                )

                if (!match) {
                    throw new Error(
                        "Failed to parse revert bytes from RPC response"
                    )
                }

                const data: Hex = match[0]

                const error = decodeErrorResult({
                    abi: [
                        {
                            inputs: [
                                {
                                    internalType: "address",
                                    name: "sender",
                                    type: "address"
                                }
                            ],
                            name: "SenderAddressResult",
                            type: "error"
                        }
                    ],
                    data
                })

                return error.args[0] as Address
            }
        }

        throw e
    }

    throw new InvalidEntryPointError({ entryPoint })
}
