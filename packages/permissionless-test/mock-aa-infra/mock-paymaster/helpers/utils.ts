import { http, type Address, type Hex, createWalletClient } from "viem"
import { mnemonicToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { ERC20_ADDRESS } from "../../../src/erc20-utils"
import { RpcError, ValidationErrors } from "./schema"

/// Returns the bigger of two BigInts.
export const maxBigInt = (a: bigint, b: bigint) => {
    return a > b ? a : b
}

export const getAnvilWalletClient = (anvilRpc: string) => {
    const account = mnemonicToAccount(
        "test test test test test test test test test test test junk",
        {
            /* avoid nonce error with index 0 when deploying ep contracts. */
            addressIndex: 1
        }
    )

    const walletClient = createWalletClient({
        account,
        chain: foundry,
        transport: http(anvilRpc)
    })

    return walletClient
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
