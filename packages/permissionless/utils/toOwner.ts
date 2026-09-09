import { Account, Actions, type Chain, Client, custom } from "viem"
import type { Address, Provider } from "viem/utils"
import type { OneOf } from "../types/utils.js"
import { getAction } from "./getAction.js"

export type EthereumProvider = OneOf<
    // biome-ignore lint/suspicious/noExplicitAny: matches viem custom(); narrowed by the 1.0 EthereumProvider any-drop
    { request(...args: any): Promise<any> } | Provider.Provider>

type WalletClient = Client.Client<Chain.Chain | undefined, Account.Account>

export async function toOwner<provider extends EthereumProvider>({
    owner,
    address
}: {
    owner: OneOf<provider | WalletClient | Account.Local>
    address?: Address.Address
}): Promise<Account.Local> {
    if ("type" in owner && owner.type === "local") {
        return owner as Account.Local
    }

    let walletClient: WalletClient | undefined

    if ("request" in owner) {
        if (!address) {
            try {
                ;[address] = await (owner as EthereumProvider).request({
                    method: "eth_requestAccounts"
                })
            } catch {
                ;[address] = await (owner as EthereumProvider).request({
                    method: "eth_accounts"
                })
            }
        }
        if (!address) {
            // For TS to be happy
            throw new Error("address is required")
        }
        walletClient = Client.create({
            account: address,
            transport: custom(owner as EthereumProvider)
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
            const action = getAction(
                client,
                Actions.typedData.sign,
                "typedData.sign"
            )
            // biome-ignore lint/suspicious/noExplicitAny: TypedData.Definition does not convert to Actions.typedData.sign.Options
            return action(typedData as any)
        },
        async signTransaction() {
            throw new Error(
                "Smart account signer doesn't need to sign transactions"
            )
        }
    }

    return Account.from(source)
}
