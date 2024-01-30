import { type SmartAccountClient, chainId } from "permissionless"
import { type SmartAccount } from "permissionless/accounts"
import type { Chain, Transport } from "viem"
import { createConnector } from "wagmi"

export function smartAccount<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
    account extends SmartAccount = SmartAccount
>({
    smartAccountClient,
    id = smartAccountClient.uid,
    name = smartAccountClient.name,
    type = "smart-account"
}: {
    smartAccountClient: SmartAccountClient<transport, chain, account> & {
        estimateGas?: () => undefined | bigint
    }
    id?: string
    name?: string
    type?: string
}) {
    // Don't remove this, it is needed because wagmi has an opinion on always estimating gas:
    // https://github.com/wevm/wagmi/blob/main/packages/core/src/actions/sendTransaction.ts#L77
    smartAccountClient.estimateGas = () => {
        return undefined
    }

    return createConnector((config) => ({
        id,
        name,
        type,
        // async setup() {},
        async connect({ chainId } = {}) {
            if (chainId && chainId !== (await this.getChainId())) {
                throw new Error(`Invalid chainId ${chainId} requested`)
            }

            return {
                accounts: [smartAccountClient.account.address],
                chainId: await this.getChainId()
            }
        },
        async disconnect() {},
        async getAccounts() {
            return [smartAccountClient.account.address]
        },
        getChainId() {
            return chainId(smartAccountClient)
        },
        async getProvider() {},
        async isAuthorized() {
            return !!smartAccountClient.account.address
        },
        onAccountsChanged() {
            // Not relevant
        },
        onChainChanged() {
            // Not relevant because smart accounts only exist on single chain.
        },
        onDisconnect() {
            config.emitter.emit("disconnect")
        },
        async getClient({ chainId: requestedChainId }: { chainId: number }) {
            const chainId = await this.getChainId()
            if (requestedChainId !== chainId) {
                throw new Error(`Invalid chainId ${chainId} requested`)
            }
            return smartAccountClient
        }
    }))
}
