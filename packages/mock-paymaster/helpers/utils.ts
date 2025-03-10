import {
    http,
    type Account,
    type Address,
    type Chain,
    type PublicClient,
    type Transport,
    type WalletClient,
    createPublicClient,
    createWalletClient
} from "viem"
import { mnemonicToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { ERC20_ADDRESS } from "./erc20-utils.js"
import { RpcError, ValidationErrors } from "./schema.js"

/// Returns the bigger of two BigInts.
export const maxBigInt = (a: bigint, b: bigint) => {
    return a > b ? a : b
}

export const getPublicClient = (
    anvilRpc: string
): PublicClient<Transport, Chain> => {
    const transport = http(anvilRpc, {
        // onFetchRequest: async (req) => {
        //     console.log(await req.json(), "request")
        // }
        //onFetchResponse: async (response) => {
        //    console.log(await response.clone().json(), "response")
        //}
    })

    return createPublicClient({
        chain: foundry,
        transport: transport,
        pollingInterval: 100
    })
}

export const getAnvilWalletClient = ({
    addressIndex,
    anvilRpc
}: { addressIndex: number; anvilRpc: string }): WalletClient<
    Transport,
    Chain,
    Account
> => {
    return createWalletClient({
        account: mnemonicToAccount(
            "test test test test test test test test test test test junk",
            {
                addressIndex
            }
        ),
        chain: foundry,
        transport: http(anvilRpc)
    })
}

export const isTokenSupported = async (token: Address) => {
    if (token !== ERC20_ADDRESS) {
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
