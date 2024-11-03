import { http, createPublicClient, createWalletClient } from "viem"
import {
    type SmartAccount,
    createBundlerClient,
    createPaymasterClient,
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
import {
    generatePrivateKey,
    mnemonicToAccount,
    privateKeyToAccount
} from "viem/accounts"
import { foundry } from "viem/chains"
import { toThirdwebSmartAccount } from "../../permissionless/accounts"
import { toBiconomySmartAccount } from "../../permissionless/accounts/biconomy/toBiconomySmartAccount"
import {
    type KernelVersion,
    toEcdsaKernelSmartAccount
} from "../../permissionless/accounts/kernel/toEcdsaKernelSmartAccount"
import {
    type LightAccountVersion,
    toLightSmartAccount
} from "../../permissionless/accounts/light/toLightSmartAccount"
import { toSafeSmartAccount } from "../../permissionless/accounts/safe/toSafeSmartAccount"
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

    return createBundlerClient({
        client: getPublicClient(anvilRpc),
        account,
        paymaster,
        transport: http(altoRpc),
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

export const getPimlicoClient = <entryPointVersion extends "0.6" | "0.7">({
    entryPointVersion,
    altoRpc
}: {
    entryPointVersion: entryPointVersion
    altoRpc: string
}) =>
    createPimlicoClient({
        chain: foundry,
        entryPoint: {
            address: (entryPointVersion === "0.6"
                ? entryPoint06Address
                : entryPoint07Address) as entryPointVersion extends "0.6"
                ? typeof entryPoint06Address
                : typeof entryPoint07Address,
            version: entryPointVersion
        },
        transport: http(altoRpc)
    })

export const getPublicClient = (anvilRpc: string) => {
    const transport = http(anvilRpc, {
        //onFetchRequest: async (req) => {
        //    console.log(await req.json(), "request")
        //},
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
    entryPointVersion extends "0.6" | "0.7"
>({
    entryPoint,
    anvilRpc,
    privateKey
}: AAParamType<entryPointVersion>): Promise<
    ToSimpleSmartAccountReturnType<entryPointVersion>
> => {
    return toSimpleSmartAccount<entryPointVersion>({
        client: getPublicClient(anvilRpc),
        entryPoint: {
            address:
                entryPoint.version === "0.6"
                    ? entryPoint06Address
                    : entryPoint07Address,
            version: (entryPoint.version === "0.6"
                ? "0.6"
                : "0.7") as entryPointVersion
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

export const getKernelEcdsaClient = async <
    entryPointVersion extends "0.6" | "0.7"
>({
    entryPoint,
    anvilRpc,
    version,
    privateKey
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
            version: entryPoint.version === "0.6" ? "0.6" : "0.7"
        },
        owners: [privateKeyToAccount(privateKey ?? generatePrivateKey())],
        version
    })
}

export const getSafeClient = async <entryPointVersion extends "0.6" | "0.7">({
    entryPoint,
    anvilRpc,
    erc7579,
    privateKey
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
            version: entryPoint.version === "0.6" ? "0.6" : "0.7"
        },
        owners: [privateKeyToAccount(privateKey ?? generatePrivateKey())],
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
    })
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
        isEip1271Compliant: true
    }
]
