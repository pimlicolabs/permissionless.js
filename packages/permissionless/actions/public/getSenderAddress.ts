import {
    type Address,
    BaseError,
    type Client,
    type ContractFunctionExecutionErrorType,
    ContractFunctionRevertedError,
    type Hex,
    InvalidInputRpcError,
    type OneOf,
    type Prettify,
    RpcRequestError,
    UnknownRpcError,
    concat,
    decodeErrorResult
} from "viem"

import type {
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
import { simulateContract } from "viem/actions"
import { getAction } from "viem/utils"

export type GetSenderAddressParams = OneOf<
    | {
          initCode: Hex
          entryPointAddress:
              | typeof entryPoint06Address
              | typeof entryPoint07Address
          factory?: never
          factoryData?: never
      }
    | {
          entryPointAddress:
              | typeof entryPoint06Address
              | typeof entryPoint07Address
          factory: Address
          factoryData: Hex
          initCode?: never
      }
>

export class InvalidEntryPointError extends BaseError {
    override name = "InvalidEntryPointError"

    constructor({
        cause,
        entryPointAddress
    }: { cause?: BaseError; entryPointAddress?: Address } = {}) {
        super(
            `The entry point address (\`entryPoint\`${
                entryPointAddress ? ` = ${entryPointAddress}` : ""
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
export const getSenderAddress = async (
    client: Client,
    args: Prettify<GetSenderAddressParams>
): Promise<Address> => {
    const { initCode, entryPointAddress, factory, factoryData } = args

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
            address: entryPointAddress,
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
        const revertError = (e as ContractFunctionExecutionErrorType).walk(
            (err) =>
                err instanceof ContractFunctionRevertedError ||
                err instanceof RpcRequestError ||
                err instanceof InvalidInputRpcError ||
                err instanceof UnknownRpcError
        )

        if (revertError instanceof ContractFunctionRevertedError) {
            const errorName = revertError.data?.errorName ?? ""
            if (
                errorName === "SenderAddressResult" &&
                revertError.data?.args &&
                revertError.data?.args[0]
            ) {
                return revertError.data?.args[0] as Address
            }
        }

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

        if (revertError instanceof UnknownRpcError) {
            const parsedBody = JSON.parse(
                // biome-ignore lint/suspicious/noExplicitAny:
                (revertError as unknown as any).cause.body
            )
            const revertData = parsedBody.error.data

            const hexStringRegex = /0x[a-fA-F0-9]+/
            const match = revertData.match(hexStringRegex)

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

        throw e
    }

    throw new InvalidEntryPointError({ entryPointAddress })
}
