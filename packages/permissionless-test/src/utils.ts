import {
    http,
    type Account,
    type Chain,
    type Hex,
    type LocalAccount,
    type Transport,
    createPublicClient,
    createWalletClient
} from "viem"
import {
    type EntryPointVersion,
    type SmartAccount,
    createPaymasterClient,
    entryPoint06Address,
    entryPoint07Address,
    entryPoint08Address
} from "viem/account-abstraction"
import {
    generatePrivateKey,
    mnemonicToAccount,
    privateKeyToAccount
} from "viem/accounts"
import { foundry } from "viem/chains"
import {
    type KernelVersion,
    to7702KernelSmartAccount,
    toKernelSmartAccount,
    toThirdwebSmartAccount
} from "../../permissionless/accounts"
import { toBiconomySmartAccount } from "../../permissionless/accounts/biconomy/toBiconomySmartAccount"
import { toEtherspotSmartAccount } from "../../permissionless/accounts/etherspot/toEtherspotSmartAccount"
import {
    type LightAccountVersion,
    toLightSmartAccount
} from "../../permissionless/accounts/light/toLightSmartAccount"
import { toNexusSmartAccount } from "../../permissionless/accounts/nexus/toNexusSmartAccount"
import {
    type ToSafeSmartAccountReturnType,
    toSafeSmartAccount
} from "../../permissionless/accounts/safe/toSafeSmartAccount"
import {
    type To7702SimpleSmartAccountReturnType,
    to7702SimpleSmartAccount
} from "../../permissionless/accounts/simple/to7702SimpleSmartAccount"
import {
    type ToSimpleSmartAccountReturnType,
    toSimpleSmartAccount
} from "../../permissionless/accounts/simple/toSimpleSmartAccount"
import { toTrustSmartAccount } from "../../permissionless/accounts/trust/toTrustSmartAccount"
import {
    type SmartAccountClient,
    createSmartAccountClient
} from "../../permissionless/clients/createSmartAccountClient"
import { createPimlicoClient } from "../../permissionless/clients/pimlico"
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
        version: EntryPointVersion
    }
}): SmartAccountClient<Transport, Chain, account> => {
    const address = (() => {
        if (entryPoint.version === "0.6") {
            return entryPoint06Address
        }
        if (entryPoint.version === "0.7") {
            return entryPoint07Address
        }
        return entryPoint08Address
    })()

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
        bundlerTransport: http(altoRpc),
        userOperation: {
            estimateFeesPerGas: async () => {
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

    return createSmartAccountClient({
        client: getPublicClient(anvilRpc),
        chain: foundry,
        account,
        paymaster,
        bundlerTransport: http(altoRpc)
    })
}

export const getPimlicoClient = <entryPointVersion extends EntryPointVersion>({
    entryPointVersion,
    altoRpc
}: {
    entryPointVersion: entryPointVersion
    altoRpc: string
}) =>
    createPimlicoClient({
        chain: foundry,
        entryPoint: {
            address:
                entryPointVersion === "0.6"
                    ? entryPoint06Address
                    : entryPointVersion === "0.7"
                      ? entryPoint07Address
                      : entryPoint08Address,
            version: entryPointVersion
        },
        transport: http(altoRpc)
    })

export const getPublicClient = (anvilRpc: string) => {
    const transport = http(anvilRpc, {
        // onFetchRequest: async (req) => {
        //     console.log(await req.json(), "request")
        // }
        //onFetchResponse: async (response) => {
        //    console.log(await response.clone().json(), "response")
        //}
    })

    return createPublicClient({
        chain: foundry,
        transport: transport,
        pollingInterval: 100
    })
}

export const getSimpleAccountClient = async <
    entryPointVersion extends EntryPointVersion
>({
    entryPoint,
    anvilRpc,
    privateKey
}: AAParamType<entryPointVersion>): Promise<
    ToSimpleSmartAccountReturnType<entryPointVersion>
> => {
    const entryPointMapping = {
        "0.6": entryPoint06Address,
        "0.7": entryPoint07Address,
        "0.8": entryPoint08Address
    }

    return toSimpleSmartAccount<entryPointVersion, LocalAccount>({
        client: getPublicClient(anvilRpc),
        entryPoint: {
            address: entryPointMapping[entryPoint.version],
            version: entryPoint.version as entryPointVersion
        },
        owner: privateKeyToAccount(privateKey ?? generatePrivateKey())
    })
}

export const get7702SimpleAccountClient = async ({
    anvilRpc,
    privateKey
}: AAParamType<"0.8">): Promise<To7702SimpleSmartAccountReturnType<"0.8">> => {
    return to7702SimpleSmartAccount({
        client: getPublicClient(anvilRpc),
        entryPoint: {
            address: entryPoint08Address,
            version: "0.8"
        },
        owner: privateKeyToAccount(privateKey ?? generatePrivateKey())
    })
}

export const getLightAccountClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    entryPoint,
    anvilRpc,
    version,
    privateKey
}: AAParamType<entryPointVersion> & {
    version?: LightAccountVersion<entryPointVersion>
}) => {
    return toLightSmartAccount({
        entryPoint: {
            address:
                entryPoint.version === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: entryPoint.version === "0.6" ? "0.6" : "0.7"
        },
        client: getPublicClient(anvilRpc),
        version: version ?? "1.1.0",
        owner: privateKeyToAccount(privateKey ?? generatePrivateKey())
    })
}

// Only supports v0.6 for now
export const getTrustAccountClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    anvilRpc,
    privateKey
}: AAParamType<entryPointVersion>) => {
    return toTrustSmartAccount({
        client: getPublicClient(anvilRpc),
        owner: privateKeyToAccount(privateKey ?? generatePrivateKey()),
        entryPoint: {
            address: entryPoint06Address,
            version: "0.6"
        }
    })
}

// Only supports v0.6 for now
export const getBiconomyClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    anvilRpc,
    privateKey
}: AAParamType<entryPointVersion>) => {
    return toBiconomySmartAccount({
        client: getPublicClient(anvilRpc),
        owners: [privateKeyToAccount(privateKey ?? generatePrivateKey())],
        entryPoint: {
            address: entryPoint06Address,
            version: "0.6"
        }
    })
}

export const getNexusClient = async <entryPointVersion extends "0.6" | "0.7">({
    anvilRpc,
    privateKey
}: AAParamType<entryPointVersion>) => {
    return toNexusSmartAccount({
        client: getPublicClient(anvilRpc),
        owners: [privateKeyToAccount(privateKey ?? generatePrivateKey())],
        version: "1.0.0"
    })
}

export const getKernelEcdsaClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    entryPoint,
    anvilRpc,
    version,
    privateKey,
    useMetaFactory,
    eip7702 = false
}: AAParamType<entryPointVersion> & {
    version?: KernelVersion<entryPointVersion>
    useMetaFactory?: boolean
    eip7702?: boolean
}) => {
    const publicClient = getPublicClient(anvilRpc)

    if (
        (version === "0.3.0-beta" || version === "0.3.1") &&
        entryPoint.version === "0.6"
    ) {
        throw new Error("Kernel ERC7579 is not supported for V06")
    }

    if (eip7702) {
        return to7702KernelSmartAccount({
            client: publicClient,
            owner: privateKeyToAccount(privateKey ?? generatePrivateKey())
        })
    }

    return toKernelSmartAccount({
        client: publicClient,
        entryPoint: {
            address:
                entryPoint.version === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: entryPoint.version === "0.6" ? "0.6" : "0.7"
        },
        useMetaFactory,
        owners: [privateKeyToAccount(privateKey ?? generatePrivateKey())],
        version
    })
}

export const getSafeClient = async <entryPointVersion extends "0.6" | "0.7">({
    entryPoint,
    anvilRpc,
    erc7579,
    privateKey,
    owners,
    onchainIdentifier
}: {
    erc7579?: boolean
    owners?: Account[]
    onchainIdentifier?: Hex
} & AAParamType<entryPointVersion>): Promise<
    ToSafeSmartAccountReturnType<entryPointVersion>
> => {
    const publicClient = getPublicClient(anvilRpc)

    return toSafeSmartAccount({
        client: publicClient,
        onchainIdentifier,
        entryPoint: {
            address:
                entryPoint.version === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: entryPoint.version === "0.6" ? "0.6" : "0.7"
        },
        owners: owners ?? [
            privateKeyToAccount(privateKey ?? generatePrivateKey())
        ],
        version: "1.4.1",
        saltNonce: 420n,
        safe4337ModuleAddress: erc7579
            ? "0x7579EE8307284F293B1927136486880611F20002"
            : undefined,
        erc7579LaunchpadAddress: erc7579
            ? "0x7579011aB74c46090561ea277Ba79D510c6C00ff"
            : undefined,
        ...(erc7579
            ? {
                  attesters: ["0x000000333034E9f539ce08819E12c1b8Cb29084d"],
                  attestersThreshold: 1
              }
            : {})
    }) as Promise<ToSafeSmartAccountReturnType<entryPointVersion>>
}

export const getThirdwebClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    entryPoint,
    anvilRpc,
    privateKey
    // erc7579
}: {
    // erc7579?: boolean
} & AAParamType<entryPointVersion>) => {
    const publicClient = getPublicClient(anvilRpc)

    return toThirdwebSmartAccount({
        client: publicClient,
        version: "1.5.20",
        entryPoint: {
            address:
                entryPoint.version === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: entryPoint.version === "0.6" ? "0.6" : "0.7"
        },
        owner: privateKeyToAccount(privateKey ?? generatePrivateKey())
    })
}

export const getEtherspotClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    anvilRpc
}: AAParamType<entryPointVersion>) => {
    return toEtherspotSmartAccount({
        client: getPublicClient(anvilRpc),
        owners: [privateKeyToAccount(generatePrivateKey())],
        entryPoint: {
            address: entryPoint07Address,
            version: "0.7"
        }
    })
}

export const getCoreSmartAccounts = (): Array<{
    name: string
    supportsEntryPointV06: boolean
    supportsEntryPointV07: boolean
    supportsEntryPointV08: boolean
    isEip7702Compliant?: boolean
    isEip1271Compliant: boolean
    getSmartAccountClient: (
        conf: AAParamType<EntryPointVersion>
    ) => Promise<SmartAccountClient<Transport, Chain, SmartAccount>>
    getErc7579SmartAccountClient?: <
        entryPointVersion extends EntryPointVersion
    >(
        conf: AAParamType<entryPointVersion>
    ) => Promise<SmartAccountClient<Transport, Chain, SmartAccount>>
}> => [
    {
        name: "Trust",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) => {
            return getBundlerClient({
                account: await getTrustAccountClient(
                    conf as AAParamType<"0.6" | "0.7">
                ),
                ...conf
            })
        },
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "LightAccount 1.1.0",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getLightAccountClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "1.1.0" as LightAccountVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "LightAccount 2.0.0",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getLightAccountClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "2.0.0" as LightAccountVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Simple",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getSimpleAccountClient(conf),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        supportsEntryPointV08: true,
        isEip1271Compliant: false
    },
    {
        name: "Simple + EIP-7702",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await get7702SimpleAccountClient(
                    conf as AAParamType<"0.8">
                ),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: false,
        supportsEntryPointV08: true,
        isEip7702Compliant: true,
        isEip1271Compliant: false
    },
    {
        name: "Kernel 0.2.1",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.2.1" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 0.2.2",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.2.2" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 0.2.3",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.2.3" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 0.2.4",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.2.4" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.0-beta (non meta factory deployment)",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.0-beta" as KernelVersion<"0.6" | "0.7">,
                    useMetaFactory: false
                }),
                ...conf
            }),
        getErc7579SmartAccountClient: async (
            conf: AAParamType<EntryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.0-beta" as KernelVersion<"0.6" | "0.7">,
                    useMetaFactory: false
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.0-beta",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.0-beta" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        getErc7579SmartAccountClient: async (
            conf: AAParamType<EntryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.0-beta" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.1 (non meta factory deployment)",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.1" as KernelVersion<"0.6" | "0.7">,
                    useMetaFactory: false
                }),
                ...conf
            }),
        getErc7579SmartAccountClient: async (
            conf: AAParamType<EntryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.1" as KernelVersion<"0.6" | "0.7">,
                    useMetaFactory: false
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.1",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.1" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        getErc7579SmartAccountClient: async (
            conf: AAParamType<EntryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.1" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.2",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.2" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        getErc7579SmartAccountClient: async (
            conf: AAParamType<EntryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.2" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.3",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.3" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        getErc7579SmartAccountClient: async (
            conf: AAParamType<EntryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.3" as KernelVersion<"0.6" | "0.7">
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 0.3.3 + EIP-7702",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    version: "0.3.3" as KernelVersion<"0.6" | "0.7">,
                    eip7702: true
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip7702Compliant: true,
        isEip1271Compliant: true
    },
    {
        name: "Biconomy",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getBiconomyClient(
                    conf as AAParamType<"0.6" | "0.7">
                ),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Nexus",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getNexusClient(
                    conf as AAParamType<"0.6" | "0.7">
                ),
                ...conf
            }),
        getErc7579SmartAccountClient: async (
            conf: AAParamType<EntryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getNexusClient(
                    conf as AAParamType<"0.6" | "0.7">
                ),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Safe",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getSafeClient(
                    conf as AAParamType<"0.6" | "0.7">
                ),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Safe (with onchain identifier)",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getSafeClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    onchainIdentifier: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
                }),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Safe multiple owners",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getSafeClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    owners: [
                        privateKeyToAccount(generatePrivateKey()),
                        privateKeyToAccount(generatePrivateKey()),
                        privateKeyToAccount(generatePrivateKey())
                    ]
                }),
                ...conf
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Safe 7579",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getSafeClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    erc7579: true
                }),
                ...conf
            }),
        getErc7579SmartAccountClient: async (
            conf: AAParamType<EntryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getSafeClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    erc7579: true
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Safe 7579 Multiple Owners",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getSafeClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    erc7579: true,
                    owners: [
                        privateKeyToAccount(generatePrivateKey()),
                        privateKeyToAccount(generatePrivateKey()),
                        privateKeyToAccount(generatePrivateKey())
                    ]
                }),
                ...conf
            }),
        getErc7579SmartAccountClient: async (
            conf: AAParamType<EntryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getSafeClient({
                    ...(conf as AAParamType<"0.6" | "0.7">),
                    erc7579: true
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Etherspot",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getEtherspotClient(
                    conf as AAParamType<"0.6" | "0.7">
                ),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Thirdweb",
        getSmartAccountClient: async (conf: AAParamType<EntryPointVersion>) =>
            getBundlerClient({
                account: await getThirdwebClient({
                    ...(conf as AAParamType<"0.6" | "0.7">)
                }),
                ...conf
            }),
        // getErc7579SmartAccountClient: async <
        //     entryPointVersion extends EntryPointVersion
        // >(
        //     conf: AAParamType<entryPointVersion>
        // ) =>
        //     getSmartAccountClient({
        //         account: await getSafeClient({ ...conf, erc7579: true }),
        //         ...conf
        //     }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    }
]
