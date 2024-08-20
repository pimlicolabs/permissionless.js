import type {
    Account,
    Chain,
    Hex,
    LocalAccount,
    SignableMessage,
    Transport,
    TypedData,
    TypedDataDefinition,
    WalletClient
} from "viem"

import { signTypedData } from "viem/actions"

export function walletClientToSmartAccountSigner<
    TChain extends Chain | undefined = Chain | undefined
>(walletClient: WalletClient<Transport, TChain, Account>): LocalAccount {
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
        signTransaction: async (_): Promise<Hex> => {
            throw new Error(
                "Smart account signer doesn't need to sign transactions"
            )
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
