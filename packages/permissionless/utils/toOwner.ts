import {
    type Account,
    type Address,
    type Chain,
    type EIP1193Provider,
    type EIP1193RequestFn,
    type EIP1474Methods,
    type LocalAccount,
    type OneOf,
    type Transport,
    type WalletClient,
    createWalletClient,
    custom
} from "viem"
import { toAccount } from "viem/accounts"

import { signTypedData } from "viem/actions"
import { getAction } from "viem/utils"

export async function toOwner({
    owner,
    address
}: {
    owner: OneOf<
        EIP1193Provider | WalletClient<Transport, Chain | undefined, Account>
    >
    address?: Address
}): Promise<LocalAccount> {
    if ("request" in owner) {
        if (!address) {
            try {
                ;[address] = await (
                    owner.request as EIP1193RequestFn<EIP1474Methods>
                )({
                    method: "eth_requestAccounts"
                })
            } catch {
                ;[address] = await (
                    owner.request as EIP1193RequestFn<EIP1474Methods>
                )({
                    method: "eth_accounts"
                })
            }
        }
        if (!address) {
            // For TS to be happy
            throw new Error("address is required")
        }
        owner = createWalletClient({
            account: address,
            transport: custom(owner)
        })
    }

    return toAccount({
        address: owner.account.address,
        async signMessage({ message }) {
            return owner.signMessage({ message })
        },
        async signTypedData(typedData) {
            return getAction(
                owner,
                signTypedData,
                "signTypedData"
            )(typedData as any)
        },
        async signTransaction(_) {
            throw new Error(
                "Smart account signer doesn't need to sign transactions"
            )
        }
    })
}
