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

import { signTypedData } from "viem/actions"
import type { SmartAccountSigner } from "../accounts/types"

export function walletClientToSmartAccountSigner<
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
        async signTypedData<
            const TTypedData extends TypedData | Record<string, unknown>,
            TPrimaryType extends
                | keyof TTypedData
                | "EIP712Domain" = keyof TTypedData
        >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
            return signTypedData<TTypedData, TPrimaryType, TChain, Account>(
                walletClient,
                {
                    account: walletClient.account,
                    ...typedData
                }
            )
        }
    }
}
