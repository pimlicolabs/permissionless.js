import { Account, Actions, type Chain, Client, custom } from "viem"
import type { Address, TypedData } from "viem/utils"
import { getAction } from "./getAction.js"

// Method syntax is load-bearing (bivariant params), see toOwner.test-d.ts
export type EthereumProvider = {
    request(args: { method: string; params?: unknown }): Promise<unknown>
}

type WalletClient = Client.Client<Chain.Chain | undefined, Account.Account>

export async function toOwner({
    owner,
    address
}: {
    owner: EthereumProvider | WalletClient | Account.Local
    address?: Address.Address
}): Promise<Account.Local> {
    if ("type" in owner && owner.type === "local") {
        return owner as Account.Local
    }

    let walletClient: WalletClient | undefined

    if ("request" in owner) {
        const provider = owner as EthereumProvider
        if (!address) {
            try {
                ;[address] = (await provider.request({
                    method: "eth_requestAccounts"
                })) as Address.Address[]
            } catch {
                ;[address] = (await provider.request({
                    method: "eth_accounts"
                })) as Address.Address[]
            }
        }
        if (!address) {
            // For TS to be happy
            throw new Error("address is required")
        }
        walletClient = Client.create({
            account: address,
            transport: custom(provider)
        })
    }

    if (!walletClient) {
        walletClient = owner as WalletClient
    }

    const client = walletClient

    const source: Account.from.Account = {
        address: client.account.address,
        sign() {
            throw new Error("Smart account signer doesn't sign raw hashes")
        },
        async signMessage({ message }) {
            return getAction(
                client,
                Actions.signMessage,
                "signMessage"
            )({ message })
        },
        async signTypedData(typedData) {
            return getAction(
                client,
                Actions.typedData.sign,
                "typedData.sign"
            )(typedData as TypedData.encode.Value)
        },
        async signTransaction() {
            throw new Error(
                "Smart account signer doesn't need to sign transactions"
            )
        }
    }

    return Account.from(source)
}
