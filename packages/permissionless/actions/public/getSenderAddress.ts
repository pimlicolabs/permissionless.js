import {
    type Address,
    BaseError,
    type Client,
    type Hex,
    type OneOf,
    type Prettify,
    concat,
    decodeAbiParameters,
    encodeDeployData
} from "viem"

import { call } from "viem/actions"
import { getAction } from "viem/utils"

// https://github.com/pimlicolabs/contracts/blob/80277d0de609e6b5fb4cedeeb1fb9a023caed59f/src/GetSenderAddressHelper.sol
const GetSenderAddressHelperByteCode =
    "0x60806040526102a28038038091610015826100ae565b6080396040816080019112610093576080516001600160a01b03811681036100935760a0516001600160401b0381116100935782609f82011215610093578060800151610061816100fc565b9361006f60405195866100d9565b81855260a082840101116100935761008e9160a0602086019101610117565b610196565b600080fd5b634e487b7160e01b600052604160045260246000fd5b6080601f91909101601f19168101906001600160401b038211908210176100d457604052565b610098565b601f909101601f19168101906001600160401b038211908210176100d457604052565b6001600160401b0381116100d457601f01601f191660200190565b60005b83811061012a5750506000910152565b818101518382015260200161011a565b6040916020825261015a8151809281602086015260208686019101610117565b601f01601f1916010190565b3d15610191573d90610177826100fc565b9161018560405193846100d9565b82523d6000602084013e565b606090565b600091908291826040516101cd816101bf6020820195639b249f6960e01b87526024830161013a565b03601f1981018352826100d9565b51925af16101d9610166565b906102485760048151116000146101f7576024015160005260206000f35b60405162461bcd60e51b8152602060048201526024808201527f67657453656e64657241646472657373206661696c656420776974686f7574206044820152636461746160e01b6064820152608490fd5b60405162461bcd60e51b815260206004820152602b60248201527f67657453656e6465724164647265737320646964206e6f74207265766572742060448201526a185cc8195e1c1958dd195960aa1b6064820152608490fdfe"

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

    return decodeAbiParameters([{ type: "address" }], data)[0]
}
