import type {
    Account,
    Address,
    Chain,
    Hex,
    SignableMessage,
    Transport,
    TypedData,
    TypedDataDefinition,
    WalletClient
} from "viem"

import type { SmartAccountSigner } from "../accounts/types.js"

export function walletClientToCustomSigner<
    TChain extends Chain | undefined = Chain | undefined
>(
    walletClient: WalletClient<Transport, TChain, Account>
): SmartAccountSigner<"custom", Address> {
    return {
        address: walletClient.account.address,
        type: "local",
        source: "custom",
        publicKey: walletClient.account.address,
        signMessage: async ({
            message
        }: { message: SignableMessage }): Promise<Hex> => {
            return walletClient.signMessage({ message })
        },
        signTypedData: async <
            const TTypedData extends TypedData | { [key: string]: unknown },
            TPrimaryType extends string = string
        >(
            typedData: TypedDataDefinition<TTypedData, TPrimaryType>
        ): Promise<Hex> => {
            return walletClient.signTypedData({
                account: walletClient.account,
                ...typedData
            })
        }
    }
}
