import {
    Account,
    Actions,
    type Chain,
    Client,
    http,
    publicActions,
    type Transport,
    walletActions
} from "viem"
import { anvil } from "viem/chains"
import { EntryPoint, PaymasterClient, type SmartAccount } from "viem/erc4337"
import {
    createSmartAccountClient,
    type SmartAccountClient
} from "../../permissionless/clients/createSmartAccountClient"
import { createPimlicoClient } from "../../permissionless/clients/pimlico"
import { etherspotSmartAccounts } from "./accounts/etherspot.js"
import { kernelSmartAccounts } from "./accounts/kernel.js"
import { lightSmartAccounts } from "./accounts/light.js"
import { nexusSmartAccounts } from "./accounts/nexus.js"
import { safeSmartAccounts } from "./accounts/safe.js"
import { simpleSmartAccounts } from "./accounts/simple.js"
import { thirdwebSmartAccounts } from "./accounts/thirdweb.js"
import { trustSmartAccounts } from "./accounts/trust.js"
import { createAutoBundleTransport } from "./testWithRpc"
import type { AAParamType } from "./types"

export const PAYMASTER_RPC = "http://localhost:3000"

const entryPointAddress = (version: EntryPoint.Version) => {
    if (version === "0.6") {
        return EntryPoint.addressV06
    }
    if (version === "0.7") {
        return EntryPoint.addressV07
    }
    return EntryPoint.addressV08
}

export const ensureBundlerIsReady = async ({
    altoRpc,
    anvilRpc
}: {
    altoRpc: string
    anvilRpc: string
}) => {
    const bundlerClient = getBundlerClient({
        altoRpc: altoRpc,
        anvilRpc,
        entryPoint: {
            version: "0.6"
        }
    })

    while (true) {
        try {
            await Actions.chains.getId(
                bundlerClient as unknown as Client.Client
            )
            return
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }
}

export const ensurePaymasterIsReady = async () => {
    while (true) {
        try {
            const res = await fetch(`${PAYMASTER_RPC}/ping`)
            const data = await res.json()
            if (data.message !== "pong") {
                throw new Error("nope")
            }

            return
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }
}

export const getAnvilWalletClient = ({
    addressIndex,
    anvilRpc
}: {
    addressIndex: number
    anvilRpc: string
}) => {
    return Client.create({
        account: Account.fromMnemonic(
            "test test test test test test test test test test test junk",
            {
                addressIndex
            }
        ),
        chain: anvil,
        transport: http(anvilRpc)
    }).extend(walletActions())
}

export const getBundlerClient = <
    account extends SmartAccount.SmartAccount | undefined
>({
    altoRpc,
    anvilRpc,
    account,
    paymasterRpc,
    entryPoint
}: {
    altoRpc: string
    paymasterRpc?: string
    anvilRpc: string
    account?: account
    entryPoint: {
        version: EntryPoint.Version
    }
}): SmartAccountClient<Transport.Transport, Chain.Chain, account> => {
    const address = entryPointAddress(entryPoint.version)

    const paymaster = paymasterRpc
        ? createPimlicoClient({
              transport: http(paymasterRpc),
              entryPoint: {
                  address,
                  version: entryPoint.version
              }
          })
        : undefined

    const pimlicoBundler = createPimlicoClient({
        transport: http(altoRpc),
        entryPoint: {
            address,
            version: entryPoint.version
        }
    })

    return createSmartAccountClient({
        client: getPublicClient(anvilRpc),
        account,
        paymaster,
        pollingInterval: 100,
        bundlerTransport: createAutoBundleTransport(altoRpc, anvilRpc),
        userOperation: {
            estimateFeesPerGas: async () => {
                return (await pimlicoBundler.getUserOperationGasPrice()).fast
            }
        }
    })
}

export const getSmartAccountClient = <
    account extends SmartAccount.SmartAccount | undefined
>({
    altoRpc,
    anvilRpc,
    account,
    paymasterRpc
}: {
    altoRpc: string
    paymasterRpc?: string
    anvilRpc: string
    account?: account
}) => {
    const paymaster = paymasterRpc
        ? PaymasterClient.create({
              transport: http(paymasterRpc)
          })
        : undefined

    return createSmartAccountClient({
        client: getPublicClient(anvilRpc),
        chain: anvil,
        account,
        paymaster,
        pollingInterval: 100,
        bundlerTransport: createAutoBundleTransport(altoRpc, anvilRpc)
    })
}

export const getPimlicoClient = <entryPointVersion extends EntryPoint.Version>({
    entryPointVersion,
    altoRpc
}: {
    entryPointVersion: entryPointVersion
    altoRpc: string
}) => {
    return createPimlicoClient({
        chain: anvil,
        entryPoint: {
            address: entryPointAddress(entryPointVersion),
            version: entryPointVersion
        },
        transport: http(altoRpc),
        pollingInterval: 100
    })
}

export const getPublicClient = (anvilRpc: string) => {
    return Client.create({
        chain: anvil,
        transport: http(anvilRpc),
        pollingInterval: 100
    }).extend(publicActions())
}

export type CoreSmartAccount = {
    name: string
    supportsEntryPointV06: boolean
    supportsEntryPointV07: boolean
    supportsEntryPointV08: boolean
    isEip7702Compliant?: boolean
    isEip1271Compliant: boolean
    getSmartAccountClient: (
        conf: AAParamType<EntryPoint.Version>
    ) => Promise<
        SmartAccountClient<
            Transport.Transport,
            Chain.Chain,
            SmartAccount.SmartAccount
        >
    >
    getErc7579SmartAccountClient?: <
        entryPointVersion extends EntryPoint.Version
    >(
        conf: AAParamType<entryPointVersion>
    ) => Promise<
        SmartAccountClient<
            Transport.Transport,
            Chain.Chain,
            SmartAccount.SmartAccount
        >
    >
}

// Each account port ticket (10-17) fills its own file under ./accounts/.
export const getCoreSmartAccounts = (): CoreSmartAccount[] => [
    ...etherspotSmartAccounts,
    ...kernelSmartAccounts,
    ...lightSmartAccounts,
    ...nexusSmartAccounts,
    ...safeSmartAccounts,
    ...simpleSmartAccounts,
    ...thirdwebSmartAccounts,
    ...trustSmartAccounts
]
