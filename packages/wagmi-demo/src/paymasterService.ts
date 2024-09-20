import type EventEmitter from "eventemitter3"
import {
    type Address,
    type WalletCapabilities,
    type WalletCapabilitiesRecord,
    type WalletSendCallsParameters,
    numberToHex
} from "viem"
import type { CreateConnectorFn } from "wagmi"

interface RequestArguments {
    readonly method: string
    readonly params?: readonly unknown[] | object
}

type EthereumProvider = {
    on: (event: string, fn: unknown) => void
    removeListener: (event: string, fn: unknown) => void
    request(args: RequestArguments): Promise<unknown>
}

export const paymasterService = (
    connectorFns: CreateConnectorFn[],
    {
        url
    }: {
        url: string
    }
) => {
    return connectorFns.map((connectorFn) => {
        const wrappedConnectorFn: CreateConnectorFn = (config) => {
            const connectorFnObject = connectorFn(config)

            let walletProvider: EthereumProvider
            let connectorProvider: EthereumProvider & EventEmitter
            let address: Address
            let chainId: number
            let availableCapabilities:
                | WalletCapabilitiesRecord<WalletCapabilities, number>
                | undefined = undefined
            let capabilitiesToUse: WalletSendCallsParameters<WalletCapabilities>[number]["capabilities"]

            return {
                ...connectorFnObject,
                onAccountsChanged: (accounts) => {
                    address = accounts[0] as Address
                    connectorFnObject.onAccountsChanged(accounts)
                },
                onChainChanged: (_chainId) => {
                    chainId = Number(_chainId)
                    connectorFnObject.onChainChanged(_chainId)
                },
                onConnect: (connectInfo) => {
                    chainId = Number(connectInfo.chainId)
                    connectorFnObject.onConnect?.(connectInfo)
                },
                onDisconnect: connectorFnObject.onDisconnect,
                onMessage: connectorFnObject.onMessage,
                getClient: connectorFnObject.getClient,
                setup: connectorFnObject.setup,
                switchChain: connectorFnObject.switchChain,
                async connect() {
                    const connection = await connectorFnObject.connect()

                    address = connection.accounts[0]
                    chainId = connection.chainId

                    return connection
                },
                async disconnect() {
                    await connectorFnObject.disconnect()
                },
                async getAccounts() {
                    return connectorFnObject.getAccounts()
                },
                async getChainId() {
                    return connectorFnObject.getChainId()
                },
                async isAuthorized() {
                    return connectorFnObject.isAuthorized()
                },
                async getProvider() {
                    if (walletProvider) {
                        return walletProvider
                    }

                    connectorProvider =
                        (await connectorFnObject.getProvider()) as EthereumProvider &
                            EventEmitter

                    if (!availableCapabilities) {
                        const capabilities_raw =
                            (await connectorProvider.request({
                                method: "wallet_getCapabilities",
                                params: [address]
                            })) as {
                                [x: `0x${string}`]: WalletCapabilities
                            }
                        availableCapabilities = {} as WalletCapabilitiesRecord<
                            WalletCapabilities,
                            number
                        >
                        for (const [key, value] of Object.entries(
                            capabilities_raw
                        )) {
                            availableCapabilities[Number(key)] = value
                        }
                    }

                    if (!chainId) {
                        chainId = await connectorFnObject.getChainId()
                    }

                    const capabilitiesForChain = availableCapabilities[chainId]
                    if (capabilitiesForChain.paymasterService?.supported) {
                        capabilitiesToUse = {
                            paymasterService: {
                                url
                            }
                        }
                    } else {
                        capabilitiesToUse = undefined
                    }

                    walletProvider = {
                        on: connectorProvider.on,
                        removeListener: connectorProvider.removeListener,
                        request: async (args) => {
                            console.log({
                                method: args.method,
                                params: args.params,
                                capabilitiesToUse
                            })

                            if (
                                args.method === "eth_sendTransaction" &&
                                capabilitiesToUse &&
                                args.params
                            ) {
                                console.log({
                                    params: [
                                        {
                                            calls: [
                                                {
                                                    to: (args.params as any)[0]
                                                        .to,
                                                    value: (
                                                        args.params as any
                                                    )[0].value,
                                                    data: (
                                                        args.params as any
                                                    )[0].data
                                                }
                                            ],
                                            capabilities: capabilitiesToUse,
                                            chainId: numberToHex(chainId),
                                            from: address,
                                            version: "1.0"
                                        }
                                    ]
                                })

                                return connectorProvider.request({
                                    method: "wallet_sendCalls",
                                    params: [
                                        {
                                            calls: [
                                                {
                                                    to: (args.params as any)[0]
                                                        .to,
                                                    value: (
                                                        args.params as any
                                                    )[0].value,
                                                    data: (
                                                        args.params as any
                                                    )[0].data
                                                }
                                            ],
                                            capabilities: capabilitiesToUse,
                                            chainId: numberToHex(chainId),
                                            from: address,
                                            version: "1.0"
                                        }
                                    ]
                                })
                            }

                            return connectorProvider.request(args)
                        }
                    }

                    return walletProvider
                }
            }
        }

        return wrappedConnectorFn
    })
}
