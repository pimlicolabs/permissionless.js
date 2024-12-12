import {
    type Address,
    BaseError,
    type Client,
    type Hex,
    type OneOf,
    type Prettify,
    concat,
    encodeDeployData,
    getAddress
} from "viem"

import { call } from "viem/actions"
import { getAction } from "viem/utils"

// https://github.com/pimlicolabs/entrypoint-estimations/blob/main/src/GetSenderAddressHelper.sol
const GetSenderAddressHelperByteCode =
    "0x6080604052604051610302380380610302833981016040819052610022916101de565b600080836001600160a01b0316639b249f6960e01b8460405160240161004891906102b2565b60408051601f198184030181529181526020820180516001600160e01b03166001600160e01b031990941693909317909252905161008691906102e5565b6000604051808303816000865af19150503d80600081146100c3576040519150601f19603f3d011682016040523d82523d6000602084013e6100c8565b606091505b5091509150600082610148576004825111156100ef5760248201519050806000526014600cf35b60405162461bcd60e51b8152602060048201526024808201527f67657453656e64657241646472657373206661696c656420776974686f7574206044820152636461746160e01b60648201526084015b60405180910390fd5b60405162461bcd60e51b815260206004820152602b60248201527f67657453656e6465724164647265737320646964206e6f74207265766572742060448201526a185cc8195e1c1958dd195960aa1b606482015260840161013f565b634e487b7160e01b600052604160045260246000fd5b60005b838110156101d55781810151838201526020016101bd565b50506000910152565b600080604083850312156101f157600080fd5b82516001600160a01b038116811461020857600080fd5b60208401519092506001600160401b0381111561022457600080fd5b8301601f8101851361023557600080fd5b80516001600160401b0381111561024e5761024e6101a4565b604051601f8201601f19908116603f011681016001600160401b038111828210171561027c5761027c6101a4565b60405281815282820160200187101561029457600080fd5b6102a58260208301602086016101ba565b8093505050509250929050565b60208152600082518060208401526102d18160408501602087016101ba565b601f01601f19169190910160400192915050565b600082516102f78184602087016101ba565b919091019291505056fe"

const GetSenderAddressHelperAbi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "_entryPoint",
                type: "address"
            },
            {
                internalType: "bytes",
                name: "initCode",
                type: "bytes"
            }
        ],
        stateMutability: "payable",
        type: "constructor"
    }
]

export type GetSenderAddressParams = OneOf<
    | {
          initCode: Hex
          entryPointAddress: Address
          factory?: never
          factoryData?: never
      }
    | {
          entryPointAddress: Address
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

    const formattedInitCode =
        initCode || concat([factory as Hex, factoryData as Hex])

    const { data } = await getAction(
        client,
        call,
        "call"
    )({
        data: encodeDeployData({
            abi: GetSenderAddressHelperAbi,
            bytecode: GetSenderAddressHelperByteCode,
            args: [entryPointAddress, formattedInitCode]
        })
    })

    if (!data) {
        throw new Error("Failed to get sender address")
    }

    return getAddress(data)
}
