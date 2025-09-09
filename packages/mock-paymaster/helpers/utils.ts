import {
    http,
    type Address,
    type Chain,
    type PublicClient,
    type Transport,
    createPublicClient,
    defineChain
} from "viem"
import { erc20Address } from "./erc20-utils.js"
import { RpcError, ValidationErrors } from "./schema.js"

/// Returns the bigger of two BigInts.
export const maxBigInt = (a: bigint, b: bigint) => {
    return a > b ? a : b
}

export const getChain = async (rpcUrl: string): Promise<Chain> => {
    const tempClient = createPublicClient({
        transport: http(rpcUrl)
    })

    const chainId = await tempClient.getChainId()

    return defineChain({
        id: chainId,
        name: `Chain ${chainId}`,
        nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18
        },
        rpcUrls: {
            default: {
                http: [rpcUrl]
            }
        }
    })
}

export const getPublicClient = async (
    anvilRpc: string
): Promise<PublicClient<Transport, Chain>> => {
    const transport = http(anvilRpc, {
        // onFetchRequest: async (req) => {
        //     console.log(await req.json(), "request")
        // }
        //onFetchResponse: async (response) => {
        //    console.log(await response.clone().json(), "response")
        //}
    })

    const chain = await getChain(anvilRpc)

    return createPublicClient({
        chain,
        transport: transport,
        pollingInterval: 100
    })
}

export const isTokenSupported = async (token: Address) => {
    if (token !== erc20Address) {
        throw new RpcError(
            "Token is not supported",
            ValidationErrors.InvalidFields
        )
    }
}

export type PaymasterMode =
    | {
          mode: "verifying"
      }
    | {
          mode: "erc20"
          token: Address
      }
