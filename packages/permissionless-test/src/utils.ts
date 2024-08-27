import {
    http,
    type Account,
    type Address,
    type Chain,
    type Hex,
    type Transport,
    type WalletClient,
    createClient,
    createPublicClient,
    createWalletClient,
    getAddress,
    parseEther
} from "viem"
import {
    generatePrivateKey,
    mnemonicToAccount,
    privateKeyToAccount
} from "viem/accounts"
import { foundry, sepolia } from "viem/chains"
import {
    type BundlerClient,
    ENTRYPOINT_ADDRESS_V06,
    ENTRYPOINT_ADDRESS_V07,
    type SmartAccountClient,
    createBundlerClient,
    createSmartAccountClient
} from "../../permissionless"
import {
    type SafeSmartAccount,
    type SmartAccount,
    privateKeyToBiconomySmartAccount,
    privateKeyToEtherspotSmartAccount,
    privateKeyToLightSmartAccount,
    privateKeyToSafeSmartAccount,
    privateKeyToSimpleSmartAccount,
    privateKeyToTrustSmartAccount,
    signerToBiconomySmartAccount,
    signerToEcdsaKernelSmartAccount,
    signerToEtherspotSmartAccount,
    signerToLightSmartAccount,
    signerToSafeSmartAccount,
    signerToSimpleSmartAccount,
    signerToTrustSmartAccount
} from "../../permissionless/accounts"
import type { KernelEcdsaSmartAccount } from "../../permissionless/accounts"
import type { KernelVersion } from "../../permissionless/accounts/kernel/signerToEcdsaKernelSmartAccount"
import {
    type PimlicoBundlerClient,
    type PimlicoPaymasterClient,
    createPimlicoBundlerClient,
    createPimlicoPaymasterClient
} from "../../permissionless/clients/pimlico"
import { paymasterActionsEip7677 } from "../../permissionless/experimental"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    EntryPoint
} from "../../permissionless/types"
import type { AAParamType, ExistingSignerParamType } from "./types"

export const PAYMASTER_RPC = "http://localhost:3000"

export const ensureBundlerIsReady = async (altoRpc: string) => {
    const bundlerClient = getBundlerClient({
        entryPoint: ENTRYPOINT_ADDRESS_V06,
        altoRpc: altoRpc
    })

    while (true) {
        try {
            await bundlerClient.chainId()
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

export const getPimlicoPaymasterClient = <T extends EntryPoint>({
    entryPoint,
    paymasterRpc
}: { entryPoint: T; paymasterRpc: string }): PimlicoPaymasterClient<T> => {
    return createPimlicoPaymasterClient({
        chain: foundry,
        transport: http(paymasterRpc),
        entryPoint
    })
}

export const getBundlerClient = <T extends EntryPoint>({
    entryPoint,
    altoRpc
}: { entryPoint: T; altoRpc: string }): BundlerClient<T, Chain> =>
    createBundlerClient({
        chain: foundry,
        entryPoint,
        transport: http(altoRpc)
    }) as BundlerClient<T, Chain>

export const getPimlicoBundlerClient = <T extends EntryPoint>({
    entryPoint,
    altoRpc
}: { entryPoint: T; altoRpc: string }): PimlicoBundlerClient<T> =>
    createPimlicoBundlerClient({
        chain: foundry,
        entryPoint,
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

export const getSimpleAccountClient = async <T extends EntryPoint>({
    entryPoint,
    paymasterClient,
    anvilRpc,
    altoRpc,
    privateKey
}: AAParamType<T>): Promise<
    SmartAccountClient<T, Transport, Chain, SmartAccount<T>>
> => {
    const publicClient = getPublicClient(anvilRpc)

    const smartAccount = privateKey
        ? await privateKeyToSimpleSmartAccount(publicClient, {
              entryPoint,
              privateKey
          })
        : await signerToSimpleSmartAccount<T, Transport, Chain>(publicClient, {
              entryPoint,
              signer: privateKeyToAccount(generatePrivateKey())
          })

    return createSmartAccountClient({
        chain: foundry,
        account: smartAccount,
        bundlerTransport: http(altoRpc),
        // @ts-ignore
        middleware: paymasterClient
            ? {
                  sponsorUserOperation: paymasterClient.sponsorUserOperation
              }
            : undefined
    })
}

export const getLightAccountClient = async <T extends EntryPoint>({
    entryPoint,
    paymasterClient,
    anvilRpc,
    altoRpc,
    privateKey
}: AAParamType<T>): Promise<
    SmartAccountClient<T, Transport, Chain, SmartAccount<T>>
> => {
    const publicClient = getPublicClient(anvilRpc)
    const smartAccount = privateKey
        ? await privateKeyToLightSmartAccount(publicClient, {
              entryPoint,
              lightAccountVersion: "1.1.0",
              privateKey
          })
        : await signerToLightSmartAccount(publicClient, {
              entryPoint,
              signer: privateKeyToAccount(generatePrivateKey()),
              lightAccountVersion: "1.1.0"
          })

    return createSmartAccountClient({
        chain: foundry,
        account: smartAccount,
        bundlerTransport: http(altoRpc),
        entryPoint: entryPoint,
        // eip7677Client: await getEip7677Client({ entryPoint }),
        middleware: {
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

// Only supports v0.6 for now
export const getTrustAccountClient = async <
    T extends ENTRYPOINT_ADDRESS_V06_TYPE
>({
    entryPoint,
    paymasterClient,
    altoRpc,
    anvilRpc,
    privateKey
}: AAParamType<T>): Promise<
    SmartAccountClient<T, Transport, Chain, SmartAccount<T>>
> => {
    const publicClient = getPublicClient(anvilRpc)
    const smartAccount = privateKey
        ? await privateKeyToTrustSmartAccount(publicClient, {
              entryPoint,
              privateKey
          })
        : await signerToTrustSmartAccount<T, Transport, Chain>(publicClient, {
              entryPoint,
              signer: privateKeyToAccount(generatePrivateKey())
          })

    // @ts-ignore
    return createSmartAccountClient({
        chain: foundry,
        account: smartAccount,
        bundlerTransport: http(altoRpc),
        middleware: {
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

// Only supports v0.6 for now
export const getBiconomyClient = async ({
    paymasterClient,
    privateKey,
    anvilRpc,
    altoRpc,
    entryPoint = ENTRYPOINT_ADDRESS_V06
}: AAParamType<ENTRYPOINT_ADDRESS_V06_TYPE>) => {
    const publicClient = getPublicClient(anvilRpc)
    const ecdsaSmartAccount = privateKey
        ? await privateKeyToBiconomySmartAccount(publicClient, {
              entryPoint,
              privateKey
          })
        : await signerToBiconomySmartAccount(publicClient, {
              entryPoint,
              signer: privateKeyToAccount(generatePrivateKey())
          })

    // @ts-ignore
    return createSmartAccountClient({
        account: ecdsaSmartAccount,
        chain: foundry,
        bundlerTransport: http(altoRpc),
        middleware: {
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

export const getKernelEcdsaClient = async <T extends EntryPoint>({
    entryPoint,
    paymasterClient,
    anvilRpc,
    altoRpc,
    privateKey = generatePrivateKey(),
    version
}: AAParamType<T> & { version?: KernelVersion<T> }): Promise<
    SmartAccountClient<T, Transport, Chain, KernelEcdsaSmartAccount<T>>
> => {
    const publicClient = getPublicClient(anvilRpc)

    if (
        (version === "0.3.0-beta" || version === "0.3.1") &&
        entryPoint === ENTRYPOINT_ADDRESS_V06
    ) {
        throw new Error("ERC7579 is not supported for V06")
    }

    const kernelEcdsaAccount =
        entryPoint === ENTRYPOINT_ADDRESS_V07
            ? await signerToEcdsaKernelSmartAccount(publicClient, {
                  entryPoint: entryPoint,
                  signer: privateKeyToAccount(privateKey),
                  version
              })
            : await signerToEcdsaKernelSmartAccount(publicClient, {
                  entryPoint,
                  signer: privateKeyToAccount(privateKey)
              })
    // @ts-ignore
    return createSmartAccountClient({
        chain: foundry,
        account: kernelEcdsaAccount as KernelEcdsaSmartAccount<T>,
        bundlerTransport: http(altoRpc),
        middleware: {
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

export const getSafeClient = async <T extends EntryPoint>({
    setupTransactions = [],
    entryPoint,
    paymasterClient,
    anvilRpc,
    altoRpc,
    privateKey,
    erc7579
}: {
    setupTransactions?: {
        to: Address
        data: Address
        value: bigint
    }[]
    anvilRpc: string
    altoRpc: string
    entryPoint: T
    paymasterClient?: PimlicoPaymasterClient<T>
    privateKey?: Hex
    erc7579?: boolean
}): Promise<SmartAccountClient<T, Transport, Chain, SafeSmartAccount<T>>> => {
    const publicClient = getPublicClient(anvilRpc)

    const safeSmartAccount = privateKey
        ? await privateKeyToSafeSmartAccount(publicClient, {
              entryPoint,
              privateKey,
              safeVersion: "1.4.1",
              saltNonce: 420n,
              safe4337ModuleAddress: erc7579
                  ? "0x3Fdb5BC686e861480ef99A6E3FaAe03c0b9F32e2"
                  : undefined,
              erc7579LaunchpadAddress: erc7579
                  ? "0xEBe001b3D534B9B6E2500FB78E67a1A137f561CE"
                  : undefined
          })
        : await signerToSafeSmartAccount(publicClient, {
              entryPoint,
              signer: privateKeyToAccount(generatePrivateKey()),
              safeVersion: "1.4.1",
              saltNonce: 420n,
              safe4337ModuleAddress: erc7579
                  ? "0x3Fdb5BC686e861480ef99A6E3FaAe03c0b9F32e2"
                  : undefined,
              erc7579LaunchpadAddress: erc7579
                  ? "0xEBe001b3D534B9B6E2500FB78E67a1A137f561CE"
                  : undefined
          })

    const pimlicoBundlerClient = getPimlicoBundlerClient({
        entryPoint,
        altoRpc
    })

    // @ts-ignore
    return createSmartAccountClient({
        chain: foundry,
        account: safeSmartAccount,
        bundlerTransport: http(altoRpc),
        middleware: {
            gasPrice: async () =>
                (await pimlicoBundlerClient.getUserOperationGasPrice()).fast,
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

export const getEtherspotClient = async ({
    entryPoint,
    paymasterClient,
    anvilRpc,
    altoRpc,
    privateKey
}: AAParamType<ENTRYPOINT_ADDRESS_V07_TYPE>) => {
    const publicClient = getPublicClient(anvilRpc)

    const safeSmartAccount = privateKey
        ? await privateKeyToEtherspotSmartAccount(publicClient, {
              entryPoint,
              privateKey
          })
        : await signerToEtherspotSmartAccount(publicClient, {
              entryPoint,
              signer: privateKeyToAccount(generatePrivateKey())
          })

    const pimlicoBundlerClient = getPimlicoBundlerClient({
        entryPoint,
        altoRpc
    })

    // @ts-ignore
    return createSmartAccountClient({
        chain: foundry,
        account: safeSmartAccount,
        bundlerTransport: http(altoRpc),
        middleware: {
            gasPrice: async () =>
                (await pimlicoBundlerClient.getUserOperationGasPrice()).fast,
            // @ts-ignore
            sponsorUserOperation: paymasterClient?.sponsorUserOperation
        }
    })
}

export const getEip7677Client = async <TEntryPoint extends EntryPoint>({
    entryPoint
}: { entryPoint: TEntryPoint }) => {
    const client = createClient({
        chain: foundry,
        transport: http(PAYMASTER_RPC)
    }).extend(paymasterActionsEip7677(entryPoint))

    return client
}

export const getCoreSmartAccounts = () => [
    {
        name: "Trust",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) => {
            if (conf.entryPoint !== ENTRYPOINT_ADDRESS_V06) {
                throw new Error("Biconomy only works with V06")
            }
            return getTrustAccountClient(
                conf as AAParamType<ENTRYPOINT_ADDRESS_V06_TYPE>
            )
        },
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        isEip1271Compliant: true
    },
    {
        name: "LightAccount v1.1.0",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) => getLightAccountClient(conf),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        isEip1271Compliant: true
    },
    {
        name: "Simple",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) => getSimpleAccountClient(conf),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        isEip1271Compliant: false
    },
    {
        name: "Kernel",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) => getKernelEcdsaClient(conf),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.0-beta",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) =>
            getKernelEcdsaClient({
                ...conf,
                version: "0.3.0-beta" as KernelVersion<T>
            }),
        getErc7579SmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) =>
            getKernelEcdsaClient({
                ...conf,
                version: "0.3.0-beta" as KernelVersion<T>
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },
    {
        name: "Kernel 7579 0.3.1",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) =>
            getKernelEcdsaClient({
                ...conf,
                version: "0.3.1" as KernelVersion<T>
            }),
        getErc7579SmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) =>
            getKernelEcdsaClient({
                ...conf,
                version: "0.3.1" as KernelVersion<T>
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },
    {
        name: "Biconomy",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) => {
            if (conf.entryPoint !== ENTRYPOINT_ADDRESS_V06) {
                throw new Error("Biconomy only works with V06")
            }
            return getBiconomyClient(
                conf as AAParamType<ENTRYPOINT_ADDRESS_V06_TYPE>
            )
        },
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        isEip1271Compliant: true
    },
    {
        name: "Safe",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) => getSafeClient(conf),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },
    {
        name: "Safe 7579",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) => getSafeClient({ ...conf, erc7579: true }),
        getErc7579SmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) => getSafeClient({ ...conf, erc7579: true }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },
    {
        name: "Etherspot",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) =>
            getEtherspotClient({
                ...(conf as AAParamType<ENTRYPOINT_ADDRESS_V07_TYPE>)
            }),
        getSmartAccountSigner: async (conf: ExistingSignerParamType) =>
            signerToEtherspotSmartAccount(conf.publicClient, {
                address: conf.existingAddress, // this is the field we are testing
                signer: privateKeyToAccount(conf.privateKey),
                entryPoint: ENTRYPOINT_ADDRESS_V07
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },
    {
        name: "Etherspot 7579",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) =>
            getEtherspotClient({
                ...(conf as AAParamType<ENTRYPOINT_ADDRESS_V07_TYPE>)
            }),
        getSmartAccountSigner: async (conf: ExistingSignerParamType) =>
            signerToEtherspotSmartAccount(conf.publicClient, {
                address: conf.existingAddress, // this is the field we are testing
                signer: privateKeyToAccount(conf.privateKey),
                entryPoint: ENTRYPOINT_ADDRESS_V07
            }),
        getErc7579SmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) =>
            getEtherspotClient({
                ...(conf as AAParamType<ENTRYPOINT_ADDRESS_V07_TYPE>)
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },

    // ---------------------------- Account from private key -------------------------------------------------

    {
        name: "Trust private key",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) => {
            if (conf.entryPoint !== ENTRYPOINT_ADDRESS_V06) {
                throw new Error("Biconomy only works with V06")
            }
            return getTrustAccountClient({
                ...(conf as AAParamType<ENTRYPOINT_ADDRESS_V06_TYPE>),
                privateKey: generatePrivateKey()
            })
        },
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        isEip1271Compliant: true
    },
    {
        name: "LightAccount v1.1.0 private key",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) =>
            getLightAccountClient({
                ...conf,
                privateKey: generatePrivateKey()
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        isEip1271Compliant: true
    },
    {
        name: "Simple private key",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) =>
            getSimpleAccountClient({
                ...conf,
                privateKey: generatePrivateKey()
            }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        isEip1271Compliant: false
    },
    {
        name: "Biconomy private key",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) => {
            if (conf.entryPoint !== ENTRYPOINT_ADDRESS_V06) {
                throw new Error("Biconomy only works with V06")
            }
            return getBiconomyClient({
                ...(conf as AAParamType<ENTRYPOINT_ADDRESS_V06_TYPE>),
                privateKey: generatePrivateKey()
            })
        },
        supportsEntryPointV06: true,
        supportsEntryPointV07: false,
        isEip1271Compliant: true
    },
    {
        name: "Safe private key private key",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) => getSafeClient({ ...conf, privateKey: generatePrivateKey() }),
        supportsEntryPointV06: true,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    },
    {
        name: "Etherspot private key private key",
        getSmartAccountClient: async <T extends EntryPoint>(
            conf: AAParamType<T>
        ) =>
            getEtherspotClient({
                ...(conf as AAParamType<ENTRYPOINT_ADDRESS_V07_TYPE>),
                privateKey: generatePrivateKey()
            }),
        getSmartAccountSigner: async (conf: ExistingSignerParamType) =>
            signerToEtherspotSmartAccount(conf.publicClient, {
                address: conf.existingAddress, // this is the field we are testing
                signer: privateKeyToAccount(conf.privateKey),
                entryPoint: ENTRYPOINT_ADDRESS_V07
            }),
        supportsEntryPointV06: false,
        supportsEntryPointV07: true,
        isEip1271Compliant: true
    }
]
