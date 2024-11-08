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
    "0x608060405260405161058a38038061058a83398181016040528101906100259190610341565b5f808373ffffffffffffffffffffffffffffffffffffffff16639b249f6960e01b8460405160240161005791906103ed565b604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050506040516100c19190610447565b5f604051808303815f865af19150503d805f81146100fa576040519150601f19603f3d011682016040523d82523d5f602084013e6100ff565b606091505b50915091505f8261015f576004825111156101245760248201519050805f526014600cf35b6040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610156906104dd565b60405180910390fd5b6040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101919061056b565b60405180910390fd5b5f604051905090565b5f80fd5b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6101d4826101ab565b9050919050565b6101e4816101ca565b81146101ee575f80fd5b50565b5f815190506101ff816101db565b92915050565b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6102538261020d565b810181811067ffffffffffffffff821117156102725761027161021d565b5b80604052505050565b5f61028461019a565b9050610290828261024a565b919050565b5f67ffffffffffffffff8211156102af576102ae61021d565b5b6102b88261020d565b9050602081019050919050565b8281835e5f83830152505050565b5f6102e56102e084610295565b61027b565b90508281526020810184848401111561030157610300610209565b5b61030c8482856102c5565b509392505050565b5f82601f83011261032857610327610205565b5b81516103388482602086016102d3565b91505092915050565b5f8060408385031215610357576103566101a3565b5b5f610364858286016101f1565b925050602083015167ffffffffffffffff811115610385576103846101a7565b5b61039185828601610314565b9150509250929050565b5f81519050919050565b5f82825260208201905092915050565b5f6103bf8261039b565b6103c981856103a5565b93506103d98185602086016102c5565b6103e28161020d565b840191505092915050565b5f6020820190508181035f83015261040581846103b5565b905092915050565b5f81905092915050565b5f6104218261039b565b61042b818561040d565b935061043b8185602086016102c5565b80840191505092915050565b5f6104528284610417565b915081905092915050565b5f82825260208201905092915050565b7f67657453656e64657241646472657373206661696c656420776974686f7574205f8201527f6461746100000000000000000000000000000000000000000000000000000000602082015250565b5f6104c760248361045d565b91506104d28261046d565b604082019050919050565b5f6020820190508181035f8301526104f4816104bb565b9050919050565b7f67657453656e6465724164647265737320646964206e6f7420726576657274205f8201527f6173206578706563746564000000000000000000000000000000000000000000602082015250565b5f610555602b8361045d565b9150610560826104fb565b604082019050919050565b5f6020820190508181035f83015261058281610549565b905091905056fe"

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

    try {
        const { data } = await getAction(
            client,
            call,
            "call"
        )({
            data: encodeDeployData({
                abi: GetSenderAddressHelperAbi,
                bytecode: GetSenderAddressHelperByteCode,
                args: [args.entryPointAddress, formattedInitCode]
            })
        })

        if (!data) {
            throw new Error("Failed to get sender address")
        }

        return getAddress(data)
    } catch (e) {
        throw new InvalidEntryPointError({ entryPointAddress })
    }
}
