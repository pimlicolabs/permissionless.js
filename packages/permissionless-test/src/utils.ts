import {
    http,
    type Account,
    type Address,
    type Chain,
    type Transport,
    type WalletClient,
    createClient,
    createPublicClient,
    createWalletClient,
    parseEther
} from "viem"
import {
    type SmartAccount,
    createBundlerClient,
    createPaymasterClient,
    entryPoint06Abi,
    entryPoint06Address,
    entryPoint07Abi,
    entryPoint07Address
} from "viem/account-abstraction"
import {
    generatePrivateKey,
    mnemonicToAccount,
    privateKeyToAccount
} from "viem/accounts"
import { foundry } from "viem/chains"
import { toBiconomySmartAccount } from "../../permissionless/accounts/biconomy/toBiconomySmartAccount"
import {
    type KernelVersion,
    toEcdsaKernelSmartAccount
} from "../../permissionless/accounts/kernel/toEcdsaKernelSmartAccount"
import { toLightSmartAccount } from "../../permissionless/accounts/light/toLightSmartAccount"
import { toSafeSmartAccount } from "../../permissionless/accounts/safe/toSafeSmartAccount"
import {
    type ToSimpleSmartAccountReturnType,
    toSimpleSmartAccount
} from "../../permissionless/accounts/simple/toSimpleSmartAccount"
import { toTrustSmartAccount } from "../../permissionless/accounts/trust/toTrustSmartAccount"
import { createSmartAccountClient } from "../../permissionless/clients/createSmartAccountClient"
import { createPimlicoClient } from "../../permissionless/clients/pimlico"
import { paymasterActionsEip7677 } from "../../permissionless/experimental"
import type { AAParamType } from "./types"

export const PAYMASTER_RPC = "http://localhost:3000"

export const ensureBundlerIsReady = async ({
    altoRpc,
    anvilRpc
}: { altoRpc: string; anvilRpc: string }) => {
    const bundlerClient = getBundlerClient({
        altoRpc: altoRpc,
        anvilRpc,
        entryPoint: {
            version: "0.6"
        }
    })

    while (true) {
        try {
            await bundlerClient.getChainId()
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
}: { addressIndex: number; anvilRpc: string }) => {
    return createWalletClient({
        account: mnemonicToAccount(
            "test test test test test test test test test test test junk",
            {
                addressIndex
            }
        ),
        chain: foundry,
        transport: http(anvilRpc)
    })
}

export const getBundlerClient = <account extends SmartAccount | undefined>({
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
        version: "0.6" | "0.7"
    }
}) => {
    const paymaster = paymasterRpc
        ? createPimlicoClient({
              transport: http(paymasterRpc),
              entryPoint: {
                  address:
                      entryPoint.version === "0.6"
                          ? entryPoint06Address
                          : entryPoint07Address,
                  version: entryPoint.version
              }
          })
        : undefined

    const pimlicoBundler = createPimlicoClient({
        transport: http(altoRpc),
        entryPoint: {
            address:
                entryPoint.version === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: entryPoint.version
        }
    })

    return createBundlerClient<Transport, undefined, account>({
        client: getPublicClient(anvilRpc),
        account,
        paymaster,
        transport: http(altoRpc),
        userOperation: {
            estimateFeesPerGas: async ({ userOperation }) => {
                return (await pimlicoBundler.getUserOperationGasPrice()).fast
            }
        }
    })
}

export const getSmartAccountClient = <
    account extends SmartAccount | undefined
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
        ? createPaymasterClient({
              transport: http(paymasterRpc)
          })
        : undefined

    return createSmartAccountClient<Transport, Chain, account>({
        client: getPublicClient(anvilRpc),
        chain: foundry,
        account,
        paymaster,
        transport: http(altoRpc)
    })
}

export const getPimlicoClient = ({
    entryPointVersion,
    altoRpc
}: {
    entryPointVersion: "0.6" | "0.7"
    altoRpc: string
}) =>
    createPimlicoClient({
        chain: foundry,
        entryPoint: {
            address:
                entryPointVersion === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: entryPointVersion
        },
        transport: http(altoRpc)
    })

export const getPublicClient = (anvilRpc: string) => {
    const transport = http(anvilRpc, {
        onFetchRequest: async (request) => {
            // console.log("fetching", await request.json())
        }
    })

    return createPublicClient({
        chain: foundry,
        transport: transport,
        pollingInterval: 100
    })
}

const usedWallets = new Set<Address>()

export const fund = async ({
    to,
    anvilRpc
}: { to: Address; anvilRpc: string }) => {
    let funder: WalletClient<Transport, Chain, Account>

    const wallets = Array.from({ length: 10 }, (_, index) =>
        getAnvilWalletClient({ addressIndex: index, anvilRpc })
    )
    const publicClient = getPublicClient(anvilRpc)

    do {
        const availableFunders = wallets.filter(
            (wallet) => !usedWallets.has(wallet.account.address)
        )
        const randomIndex = Math.floor(Math.random() * availableFunders.length)
        funder = availableFunders[randomIndex]
    } while (!funder)

    // mark the funder as used
    usedWallets.add(funder.account.address)

    const hash = await funder.sendTransaction({
        to,
        value: parseEther("1")
    })

    // wait for funding confirmation
    await publicClient.waitForTransactionReceipt({ hash })
}

export const getSimpleAccountClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    entryPoint,
    anvilRpc
}: AAParamType<entryPointVersion>): Promise<
    ToSimpleSmartAccountReturnType<
        entryPointVersion,
        entryPointVersion extends "0.6"
            ? typeof entryPoint06Abi
            : typeof entryPoint07Abi
    >
> => {
    return toSimpleSmartAccount<
        entryPointVersion,
        entryPointVersion extends "0.6"
            ? typeof entryPoint06Abi
            : typeof entryPoint07Abi
    >({
        client: getPublicClient(anvilRpc),
        entryPoint: {
            address:
                entryPoint.version === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: (entryPoint.version === "0.6"
                ? "0.6"
                : "0.7") as entryPointVersion,
            abi: (entryPoint.version === "0.6"
                ? entryPoint06Abi
                : entryPoint07Abi) as entryPointVersion extends "0.6"
                ? typeof entryPoint06Abi
                : typeof entryPoint07Abi
        },
        owner: privateKeyToAccount(generatePrivateKey())
    })
}

export const getLightAccountClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    entryPoint,
    anvilRpc
}: AAParamType<entryPointVersion>) => {
    return toLightSmartAccount({
        entryPoint: {
            address:
                entryPoint.version === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: entryPoint.version === "0.6" ? "0.6" : "0.7",
            abi:
                entryPoint.version === "0.6" ? entryPoint06Abi : entryPoint07Abi
        },
        client: getPublicClient(anvilRpc),
        version: "1.1.0",
        owner: privateKeyToAccount(generatePrivateKey())
    })
}

// Only supports v0.6 for now
export const getTrustAccountClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    anvilRpc
}: AAParamType<entryPointVersion>) => {
    return toTrustSmartAccount({
        client: getPublicClient(anvilRpc),
        owner: privateKeyToAccount(generatePrivateKey())
    })
}

// Only supports v0.6 for now
export const getBiconomyClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    anvilRpc
}: AAParamType<entryPointVersion>) => {
    return toBiconomySmartAccount({
        client: getPublicClient(anvilRpc),
        owner: privateKeyToAccount(generatePrivateKey())
    })
}

export const getKernelEcdsaClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    entryPoint,
    anvilRpc,
    version
}: AAParamType<entryPointVersion> & {
    version?: KernelVersion<entryPointVersion>
}) => {
    const publicClient = getPublicClient(anvilRpc)

    if (
        (version === "0.3.0-beta" || version === "0.3.1") &&
        entryPoint.version === "0.6"
    ) {
        throw new Error("ERC7579 is not supported for V06")
    }

    return toEcdsaKernelSmartAccount({
        client: publicClient,
        entryPoint: {
            address:
                entryPoint.version === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: entryPoint.version === "0.6" ? "0.6" : "0.7",
            abi:
                entryPoint.version === "0.6" ? entryPoint06Abi : entryPoint07Abi
        },
        owner: privateKeyToAccount(generatePrivateKey()),
        version
    })
}

export const getSafeClient = async <entryPointVersion extends "0.6" | "0.7">({
    entryPoint,
    anvilRpc,
    erc7579
}: {
    erc7579?: boolean
} & AAParamType<entryPointVersion>) => {
    const publicClient = getPublicClient(anvilRpc)

    return toSafeSmartAccount({
        client: publicClient,
        entryPoint: {
            address:
                entryPoint.version === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: entryPoint.version === "0.6" ? "0.6" : "0.7",
            abi:
                entryPoint.version === "0.6" ? entryPoint06Abi : entryPoint07Abi
        },
        owner: privateKeyToAccount(generatePrivateKey()),
        version: "1.4.1",
        saltNonce: 420n,
        safe4337ModuleAddress: erc7579
            ? "0x3Fdb5BC686e861480ef99A6E3FaAe03c0b9F32e2"
            : undefined,
        erc7579LaunchpadAddress: erc7579
            ? "0xEBe001b3D534B9B6E2500FB78E67a1A137f561CE"
            : undefined
    })
}

export const getEip7677Client = async ({
    entryPoint
}: {
    entryPoint: {
        address: typeof entryPoint06Address | typeof entryPoint07Address
        version: "0.6" | "0.7"
    }
}) => {
    const client = createClient({
        chain: foundry,
        transport: http(PAYMASTER_RPC)
    }).extend(paymasterActionsEip7677(entryPoint))

    return client
}

export const getCoreSmartAccounts = () => [
    {
        name: "Trust",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) => {
            return getBundlerClient({
                account: await getTrustAccountClient(conf),
                ...conf
            })
        },
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        isEip1271Compliant: true
    },
    {
        name: "LightAccount v1.1.0",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getLightAccountClient(conf),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        isEip1271Compliant: true
    },
    {
        name: "Simple",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getSimpleAccountClient(conf),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        isEip1271Compliant: false
    },
    {
        name: "Kernel",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getKernelEcdsaClient(conf),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.0-beta",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.3.0-beta" as KernelVersion<entryPointVersion>
                }),
                ...conf
            }),
        getErc7579SmartAccountClient: async <
            entryPointVersion extends "0.6" | "0.7"
        >(
            conf: AAParamType<entryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.3.0-beta" as KernelVersion<entryPointVersion>
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.1",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.3.1" as KernelVersion<entryPointVersion>
                }),
                ...conf
            }),
        getErc7579SmartAccountClient: async <
            entryPointVersion extends "0.6" | "0.7"
        >(
            conf: AAParamType<entryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.3.1" as KernelVersion<entryPointVersion>
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },
    {
        name: "Biconomy",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getBiconomyClient(conf),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        isEip1271Compliant: true
    },
    {
        name: "Safe",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getSafeClient(conf),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },
    {
        name: "Safe 7579",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getSafeClient({ ...conf, erc7579: true }),
                ...conf
            }),
        getErc7579SmartAccountClient: async <
            entryPointVersion extends "0.6" | "0.7"
        >(
            conf: AAParamType<entryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getSafeClient({ ...conf, erc7579: true }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    }
]
