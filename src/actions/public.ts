import type {
    Address,
    ContractFunctionExecutionErrorType,
    ContractFunctionRevertedErrorType,
    Hex,
    PublicClient
} from "viem"
import { BaseError } from "viem"

export type GetSenderAddressParams = { initCode: Hex; entryPoint: Address }
export type GetAccountNonceParams = { address: Address; entryPoint: Address; key?: bigint }

export class InvalidEntryPointError extends BaseError {
    override name = "InvalidEntryPointError"

    constructor({ cause, entryPoint }: { cause?: BaseError; entryPoint?: Address } = {}) {
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
 *
 * @param publicClient {@link PublicClient} that you created using viem's createPublicClient.
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
    publicClient: PublicClient,
    { initCode, entryPoint }: GetSenderAddressParams
): Promise<Address> => {
    try {
        await publicClient.simulateContract({
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
            args: [initCode]
        })
    } catch (e) {
        const err = e as ContractFunctionExecutionErrorType

        if (err.cause.name === "ContractFunctionRevertedError") {
            const revertError = err.cause as ContractFunctionRevertedErrorType
            const errorName = revertError.data?.errorName ?? ""
            if (errorName === "SenderAddressResult" && revertError.data?.args && revertError.data?.args[0]) {
                return revertError.data?.args[0] as Address
            }
        }

        throw e
    }

    throw new InvalidEntryPointError({ entryPoint })
}

/**
 * Returns the nonce of the account with the entry point.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/public-actions/getAccountNonce
 *
 * @param publicClient {@link PublicClient} that you created using viem's createPublicClient.
 * @param args {@link GetAccountNonceParams} address, entryPoint & key
 * @returns bigint nonce
 *
 * @example
 * import { createPublicClient } from "viem"
 * import { getAccountNonce } from "permissionless/actions"
 *
 * const publicClient = createPublicClient({
 *      chain: goerli,
 *      transport: http("https://goerli.infura.io/v3/your-infura-key")
 * })
 *
 * const nonce = await getAccountNonce(publicClient, {
 *      address,
 *      entryPoint,
 *      key
 * })
 *
 * // Return 0n
 */
export const getAccountNonce = async (
    publicClient: PublicClient,
    { address, entryPoint, key = 0n }: GetAccountNonceParams
): Promise<bigint> => {
    return await publicClient.readContract({
        address: entryPoint,
        abi: [
            {
                inputs: [
                    {
                        name: "sender",
                        type: "address"
                    },
                    {
                        name: "key",
                        type: "uint192"
                    }
                ],
                name: "getNonce",
                outputs: [
                    {
                        name: "nonce",
                        type: "uint256"
                    }
                ],
                stateMutability: "view",
                type: "function"
            }
        ],
        functionName: "getNonce",
        args: [address, key]
    })
}
