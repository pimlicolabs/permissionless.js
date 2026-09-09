import {
    type Account,
    Actions,
    Chain,
    Client,
    http,
    publicActions,
    type Transport,
    walletActions
} from "viem"
import type { Address } from "viem/utils"
import { erc20Address } from "./erc20-utils.js"
import { RpcError, ValidationErrors } from "./schema.js"

/// Returns the bigger of two BigInts.
export const maxBigInt = (a: bigint, b: bigint) => {
    return a > b ? a : b
}

export const getChain = async (rpcUrl: string): Promise<Chain.Chain> => {
    const tempClient = Client.create({
        transport: http(rpcUrl)
    })

    const chainId = await Actions.chains.getId(tempClient)

    return Chain.from({
        id: chainId,
        name: `Chain ${chainId}`,
        nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18
        },
        rpcUrls: {
            http: rpcUrl
        }
    })
}

export const getPublicClient = async (anvilRpc: string) => {
    const chain = await getChain(anvilRpc)

    return Client.create({
        chain,
        transport: http(anvilRpc),
        pollingInterval: 100
    }).extend(publicActions())
}

export type PublicClient = Awaited<ReturnType<typeof getPublicClient>>

export const createWalletClient = (options: {
    chain: Chain.Chain
    account: Account.Account
    transport: Transport.Transport
}) => Client.create(options).extend(walletActions())

export type WalletClient = ReturnType<typeof createWalletClient>

export const isTokenSupported = async (token: Address.Address) => {
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
          token: Address.Address
      }
