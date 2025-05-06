import {
    http,
    type Account,
    type Address,
    type Hex,
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
    type ToSimpleSmartAccountReturnType,
    toSimpleSmartAccount
} from "../../permissionless/accounts/simple/toSimpleSmartAccount"
import { toTrustSmartAccount } from "../../permissionless/accounts/trust/toTrustSmartAccount"
import { createSmartAccountClient } from "../../permissionless/clients/createSmartAccountClient"
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
        entryPointVersion: "0.6"
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

const getEntryPointFromVersion = <entryPointVersion extends EntryPointVersion>(
    version: EntryPointVersion
): {
    address: Address
    version: entryPointVersion
} => {
    switch (version) {
        case "0.6":
            return {
                address: entryPoint06Address,
                version: "0.6" as entryPointVersion
            }
        case "0.7":
            return {
                address: entryPoint07Address,
                version: "0.7" as entryPointVersion
            }
        case "0.8":
            return {
                address: entryPoint08Address,
                version: "0.8" as entryPointVersion
            }
        default:
            throw new Error("Unknown EntryPoint version")
    }
}

export const getBundlerClient = <account extends SmartAccount | undefined>({
    altoRpc,
    anvilRpc,
    account,
    paymasterRpc,
    entryPointVersion
}: {
    altoRpc: string
    paymasterRpc?: string
    anvilRpc: string
    account?: account
    entryPointVersion: EntryPointVersion
}) => {
    const paymaster = paymasterRpc
        ? createPimlicoClient({
              transport: http(paymasterRpc),
              entryPoint: getEntryPointFromVersion(entryPointVersion)
          })
        : undefined

    const pimlicoBundler = createPimlicoClient({
        transport: http(altoRpc),
        entryPoint: getEntryPointFromVersion(entryPointVersion)
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
        entryPoint: getEntryPointFromVersion(entryPointVersion),
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
    entryPointVersion,
    anvilRpc,
    privateKey
}: AAParamType<entryPointVersion>): Promise<
    ToSimpleSmartAccountReturnType<entryPointVersion>
> => {
    return toSimpleSmartAccount<entryPointVersion>({
        client: getPublicClient(anvilRpc),
        entryPoint: getEntryPointFromVersion(entryPointVersion),
        owner: privateKeyToAccount(privateKey ?? generatePrivateKey())
    })
}

export const getLightAccountClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    entryPointVersion,
    anvilRpc,
    version,
    privateKey
}: AAParamType<entryPointVersion> & {
    version?: LightAccountVersion<entryPointVersion>
}) => {
    return toLightSmartAccount({
        entryPoint:
            getEntryPointFromVersion<entryPointVersion>(entryPointVersion),
        client: getPublicClient(anvilRpc),
        version: version ?? ("1.1.0" as LightAccountVersion<entryPointVersion>),
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
        entryPoint: getEntryPointFromVersion("0.6")
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
        entryPoint: getEntryPointFromVersion("0.6")
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
    entryPointVersion,
    anvilRpc,
    version,
    privateKey,
    useMetaFactory
}: AAParamType<entryPointVersion> & {
    version?: KernelVersion<entryPointVersion>
    useMetaFactory?: boolean
}) => {
    const publicClient = getPublicClient(anvilRpc)

    if (
        (version === "0.3.0-beta" || version === "0.3.1") &&
        entryPointVersion === "0.6"
    ) {
        throw new Error("Kernel ERC7579 is not supported for V06")
    }

    return toKernelSmartAccount({
        client: publicClient,
        entryPoint:
            getEntryPointFromVersion<entryPointVersion>(entryPointVersion),
        useMetaFactory,
        owners: [privateKeyToAccount(privateKey ?? generatePrivateKey())],
        version
    })
}

export const getSafeClient = async <entryPointVersion extends "0.6" | "0.7">({
    entryPointVersion,
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
        entryPoint: getEntryPointFromVersion(entryPointVersion),
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
    entryPointVersion,
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
        entryPoint:
            getEntryPointFromVersion<entryPointVersion>(entryPointVersion),
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
        entryPoint: getEntryPointFromVersion<"0.7">("0.7")
    })
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
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "LightAccount 1.1.0",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getLightAccountClient({
                    ...conf,
                    version: "1.1.0" as LightAccountVersion<entryPointVersion>
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
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getLightAccountClient({
                    ...conf,
                    version: "2.0.0" as LightAccountVersion<entryPointVersion>
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
        getSmartAccountClient: async <
            entryPointVersion extends EntryPointVersion
        >(
            conf: AAParamType<entryPointVersion>
        ) =>
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
        name: "Kernel 0.2.1",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.2.1" as KernelVersion<entryPointVersion>
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
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.2.2" as KernelVersion<entryPointVersion>
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
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.2.3" as KernelVersion<entryPointVersion>
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
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.2.4" as KernelVersion<entryPointVersion>
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
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.3.0-beta" as KernelVersion<entryPointVersion>,
                    useMetaFactory: false
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
                    version: "0.3.0-beta" as KernelVersion<entryPointVersion>,
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
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.1 (non meta factory deployment)",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.3.1" as KernelVersion<entryPointVersion>,
                    useMetaFactory: false
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
                    version: "0.3.1" as KernelVersion<entryPointVersion>,
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
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.2",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.3.2" as KernelVersion<entryPointVersion>
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
                    version: "0.3.2" as KernelVersion<entryPointVersion>
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
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getKernelEcdsaClient({
                    ...conf,
                    version: "0.3.3" as KernelVersion<entryPointVersion>
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
                    version: "0.3.3" as KernelVersion<entryPointVersion>
                }),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
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
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Nexus",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getNexusClient(conf),
                ...conf
            }),
        getErc7579SmartAccountClient: async <
            entryPointVersion extends "0.6" | "0.7"
        >(
            conf: AAParamType<entryPointVersion>
        ) =>
            getSmartAccountClient({
                account: await getNexusClient(conf),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
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
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Safe (with onchain identifier)",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getSafeClient({
                    ...conf,
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
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getSafeClient({
                    ...conf,
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
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Safe 7579 Multiple Owners",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getSafeClient({
                    ...conf,
                    erc7579: true,
                    owners: [
                        privateKeyToAccount(generatePrivateKey()),
                        privateKeyToAccount(generatePrivateKey()),
                        privateKeyToAccount(generatePrivateKey())
                    ]
                }),
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
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Etherspot",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getEtherspotClient(conf),
                ...conf
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        supportsEntryPointV08: false,
        isEip1271Compliant: true
    },
    {
        name: "Thirdweb",
        getSmartAccountClient: async <entryPointVersion extends "0.6" | "0.7">(
            conf: AAParamType<entryPointVersion>
        ) =>
            getBundlerClient({
                account: await getThirdwebClient({ ...conf }),
                ...conf
            }),
        // getErc7579SmartAccountClient: async <
        //     entryPointVersion extends "0.6" | "0.7"
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
