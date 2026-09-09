import type { Account, Chain, Client, custom } from "viem"
import type { Address, Hex, Provider } from "viem/utils"
import { describe, expectTypeOf, test } from "vitest"
import * as Owner from "./owner.js"
import type { EthereumProvider } from "./toOwner.js"

type OwnerParameter = Parameters<typeof Owner.from>[0]["owner"]

// Emitter bases the SDKs inherit from, abridged to the listener API.

// node:events EventEmitter
interface NodeEventEmitter {
    on(eventName: string | symbol, listener: (...args: any[]) => void): this
    once(eventName: string | symbol, listener: (...args: any[]) => void): this
    removeListener(
        eventName: string | symbol,
        listener: (...args: any[]) => void
    ): this
    emit(eventName: string | symbol, ...args: any[]): boolean
}

// eventemitter3@5.0.1 EventEmitter<EventTypes>
interface EventEmitter3<events extends string | symbol = string | symbol> {
    on<T extends events>(
        event: T,
        fn: (...args: any[]) => void,
        context?: any
    ): this
    once<T extends events>(
        event: T,
        fn: (...args: any[]) => void,
        context?: any
    ): this
    removeListener<T extends events>(
        event: T,
        fn?: (...args: any[]) => void,
        context?: any,
        once?: boolean
    ): this
    off<T extends events>(
        event: T,
        fn?: (...args: any[]) => void,
        context?: any,
        once?: boolean
    ): this
    emit<T extends events>(event: T, ...args: any[]): boolean
}

// typed-emitter@2.1.0 TypedEventEmitter<Events>
interface TypedEventEmitter<events> {
    on<E extends keyof events>(event: E, listener: events[E]): this
    once<E extends keyof events>(event: E, listener: events[E]): this
    removeListener<E extends keyof events>(event: E, listener: events[E]): this
    emit<E extends keyof events>(
        event: E,
        ...args: events[E] extends (...args: infer args) => any ? args : never
    ): boolean
}

// viem@2.56.3 _types/types/eip1193.d.ts:17-19,42-45,1939-1984 — EIP1474Methods abridged to four entries
type Viem2RpcSchema = readonly {
    Method: string
    Parameters?: unknown
    ReturnType: unknown
}[]
type Viem2EIP1193Parameters<schema extends Viem2RpcSchema> = {
    [K in keyof schema]: {
        method: schema[K] extends schema[number] ? schema[K]["Method"] : never
    } & (schema[K] extends schema[number]
        ? schema[K]["Parameters"] extends undefined
            ? { params?: undefined }
            : { params: schema[K]["Parameters"] }
        : never)
}[number]
type Viem2EIP1193RequestFn<schema extends Viem2RpcSchema> = <
    _parameters extends
        Viem2EIP1193Parameters<schema> = Viem2EIP1193Parameters<schema>,
    _returnType = Extract<
        schema[number],
        { Method: _parameters["method"] }
    >["ReturnType"]
>(
    args: _parameters,
    options?: { retryCount?: number; retryDelay?: number } | undefined
) => Promise<_returnType>
type Viem2EIP1474Methods = [
    {
        Method: "eth_accounts"
        Parameters?: undefined
        ReturnType: Address.Address[]
    },
    { Method: "eth_chainId"; Parameters?: undefined; ReturnType: Hex.Hex },
    {
        Method: "eth_requestAccounts"
        Parameters?: undefined
        ReturnType: Address.Address[]
    },
    {
        Method: "personal_sign"
        Parameters: [data: Hex.Hex, address: Address.Address]
        ReturnType: Hex.Hex
    }
]
type Viem2EIP1193EventMap = {
    accountsChanged(accounts: Address.Address[]): void
    chainChanged(chainId: string): void
    connect(connectInfo: { chainId: string }): void
    disconnect(error: Error & { code: number; details: string }): void
    message(message: { type: string; data: unknown }): void
}
type Viem2EIP1193Events = {
    on<event extends keyof Viem2EIP1193EventMap>(
        event: event,
        listener: Viem2EIP1193EventMap[event]
    ): void
    removeListener<event extends keyof Viem2EIP1193EventMap>(
        event: event,
        listener: Viem2EIP1193EventMap[event]
    ): void
}
type Viem2EIP1193Provider = Viem2EIP1193Events & {
    request: Viem2EIP1193RequestFn<Viem2EIP1474Methods>
}

// ox@1.6.2 dist/core/Provider.d.ts:19-24 via viem@3.0.0-next.10 `viem/utils` — `window.ethereum` under `viem/window`
type OxProvider = Provider.Provider
type OxProviderWithEvents = Provider.Provider<undefined, true>

// @privy-io/react-auth@3.40.0 dist/dts/privyProxyProvider-CM211Gyv.d.mts:110-128 — ConnectedWallet.getEthereumProvider()
type PrivyEIP1193OnEventHandler =
    | ((connectInfo: { chainId: string }) => void)
    | ((error: Error & { code: number; data?: unknown }) => void)
    | ((chainId: string | number) => void)
    | ((accounts: string[]) => void)
    | ((message: { type: string; data: unknown }) => void)
interface PrivyReactAuthEIP1193Provider {
    rpcTimeoutDuration?: number
    request: (request: {
        method: string
        params?: Array<any> | undefined
    }) => Promise<any>
    on: (eventName: string, listener: PrivyEIP1193OnEventHandler) => any
    removeListener: (
        eventName: string | symbol,
        listener: (...args: any[]) => void
    ) => any
}

// @privy-io/js-sdk-core@0.73.0 dist/dts/index.d.mts:291-298
interface PrivyCoreEIP1193Provider {
    request: (request: {
        method: string
        params?: Array<unknown> | undefined
    }) => Promise<unknown>
    on: (eventName: string, listener: PrivyEIP1193OnEventHandler) => unknown
    removeListener: (
        eventName: string | symbol,
        listener: (...args: unknown[]) => void
    ) => unknown
}

// @privy-io/js-sdk-core@0.73.0 dist/dts/index.d.mts:299-308,852 — PrivyEmbeddedWalletProvider (class extends node EventEmitter)
interface PrivyEmbeddedWalletProvider extends NodeEventEmitter {
    request(request: {
        method: string
        params?: Array<any> | undefined
    }): Promise<any>
}

// @web3auth/auth@11.8.3 dist/lib.cjs/types/jrpc/interfaces.d.ts:11,62,119-122
type Web3AuthJson =
    | null
    | boolean
    | number
    | string
    | Web3AuthJson[]
    | { [prop: string]: Web3AuthJson }
type Web3AuthJRPCParams =
    | Web3AuthJson[]
    | Record<string, Web3AuthJson>
    | unknown
type Web3AuthMaybe<T> = T | Partial<T> | null | undefined
interface Web3AuthRequestArguments<T> {
    method: string
    params?: T
}
interface Web3AuthJRPCRequest<params> {
    id: number | string | null
    jsonrpc?: "2.0"
    method: string
    params?: params
}
type Web3AuthSendCallBack<U> = (err: Error | null, response?: U) => void

// @web3auth/base@9.7.0 dist/types/provider/IProvider.d.ts:1-8
type Web3AuthProviderEvents = {
    accountsChanged: (accounts: string[]) => void
    chainChanged: (chainId: string) => void
    disconnect: () => void
    connect: (data: { chainId: string }) => void
}

// @web3auth/base@9.7.0 dist/types/adapter/IAdapter.d.ts:47-53 — byte-identical in @web3auth/no-modal@11.4.1 (used by @web3auth/modal@11.4.1)
interface Web3AuthIProvider extends TypedEventEmitter<Web3AuthProviderEvents> {
    readonly chainId: string
    request<S, R>(args: Web3AuthRequestArguments<S>): Promise<Web3AuthMaybe<R>>
    sendAsync<T, U>(
        req: Web3AuthJRPCRequest<T>,
        callback: Web3AuthSendCallBack<{ result?: U }>
    ): void
    sendAsync<T, U>(req: Web3AuthJRPCRequest<T>): Promise<{ result?: U }>
    send<T, U>(
        req: Web3AuthJRPCRequest<T>,
        callback: Web3AuthSendCallBack<{ result?: U }>
    ): void
}

// @web3auth/auth@11.8.3 dist/lib.cjs/types/jrpc/safeEventEmitter.d.ts:12-16
interface Web3AuthSafeEventEmitterProvider
    extends TypedEventEmitter<{
        data: (error: unknown, message: unknown) => void
    }> {
    sendAsync: <T extends Web3AuthJRPCParams, U>(
        req: Web3AuthJRPCRequest<T>
    ) => Promise<U>
    send: <T extends Web3AuthJRPCParams, U>(
        req: Web3AuthJRPCRequest<T>,
        callback: Web3AuthSendCallBack<{ result?: U }>
    ) => void
    request: <T extends Web3AuthJRPCParams, U>(
        args: Web3AuthRequestArguments<T>
    ) => Promise<Web3AuthMaybe<U>>
}

// @magic-sdk/types@27.13.0 dist/types/core/json-rpc-types.d.ts:2-7
interface MagicJsonRpcRequestPayload<TParams = any> {
    jsonrpc: string
    id: string | number | null
    method: string
    params?: TParams
}

// @magic-sdk/provider@33.13.0 dist/types/util/promise-tools.d.ts:7-15
interface MagicExtendedPromise<T> extends Promise<T> {
    then<TResult1 = T, TResult2 = never>(
        onfulfilled?:
            | ((value: T) => TResult1 | PromiseLike<TResult1>)
            | undefined
            | null,
        onrejected?:
            | ((reason: any) => TResult2 | PromiseLike<TResult2>)
            | undefined
            | null
    ): MagicExtendedPromise<TResult1 | TResult2> & this
    catch<TResult = never>(
        onrejected?:
            | ((reason: any) => TResult | PromiseLike<TResult>)
            | undefined
            | null
    ): MagicExtendedPromise<T | TResult> & this
    finally(
        onfinally?: (() => void) | undefined | null
    ): MagicExtendedPromise<T> & this
}
type MagicEventsDefinition = Record<string, (...args: any[]) => void> | void
type MagicDefaultEvents<TResult> = {
    done: (result: TResult) => void
    error: (reason: any) => void
    settled: () => void
    "closed-by-user": () => void
}
type MagicPromiEvent<
    TResult,
    TEvents extends MagicEventsDefinition = void
> = MagicExtendedPromise<TResult> &
    TypedEventEmitter<
        TEvents extends void
            ? MagicDefaultEvents<TResult>
            : TEvents & MagicDefaultEvents<TResult>
    >

// @magic-sdk/provider@33.13.0 dist/types/modules/rpc-provider.d.ts:23-45 — Magic['rpcProvider'] (RPCProviderModule)
interface MagicRPCProviderModule {
    request<ResultType = any, Events extends MagicEventsDefinition = void>(
        payload: Partial<MagicJsonRpcRequestPayload>
    ): MagicPromiEvent<ResultType, Events>
    on: (
        event: string | symbol,
        fn: (...args: any[]) => void,
        context?: any
    ) => this
    once: (
        event: string | symbol,
        fn: (...args: any[]) => void,
        context?: any
    ) => this
    removeListener: (
        event: string | symbol,
        fn?: ((...args: any[]) => void) | undefined,
        context?: any,
        once?: boolean | undefined
    ) => this
    emit: <T extends string | symbol>(event: T, ...args: any[]) => boolean
}

// @turnkey/eip-1193-provider@3.4.40 dist/index.d.ts:6-9 — createEIP1193Provider(); request is viem@2.7.19's EIP1193RequestFn
type TurnkeyRpcSchema = [
    ...Viem2EIP1474Methods,
    {
        Method: "eth_signTypedData_v4"
        Parameters: [
            address: Address.Address,
            typedData: Record<string, unknown>
        ]
        ReturnType: Promise<Hex.Hex>
    }
]
type TurnkeyCreateEIP1193Provider = {
    on: (
        eventName: string | symbol,
        listener: (...args: any[]) => void
    ) => NodeEventEmitter
    removeListener: (
        eventName: string | symbol,
        listener: (...args: any[]) => void
    ) => NodeEventEmitter
    request: Viem2EIP1193RequestFn<TurnkeyRpcSchema>
}

// @turnkey/eip-1193-provider@3.4.40 dist/types.d.ts:12-21
type TurnkeyEIP1193Provider = Omit<Viem2EIP1193Provider, "request"> & {
    request: Viem2EIP1193RequestFn<TurnkeyRpcSchema>
}

// @coinbase/wallet-sdk@4.3.7 dist/core/provider/interface.d.ts:2-27 — createCoinbaseWalletSDK().getProvider()
interface CoinbaseRequestArguments {
    readonly method: string
    readonly params?: readonly unknown[] | object
}
type CoinbaseProviderEventMap = {
    connect: { readonly chainId: string }
    disconnect: Error & { code: number; data?: unknown }
    chainChanged: string
    accountsChanged: string[]
}
interface CoinbaseProviderInterface
    extends EventEmitter3<keyof CoinbaseProviderEventMap> {
    request(args: CoinbaseRequestArguments): Promise<unknown>
    disconnect(): Promise<void>
    emit<K extends keyof CoinbaseProviderEventMap>(
        event: K,
        ...args: [CoinbaseProviderEventMap[K]]
    ): boolean
    on<K extends keyof CoinbaseProviderEventMap>(
        event: K,
        listener: (_: CoinbaseProviderEventMap[K]) => void
    ): this
}

// @metamask/providers@22.1.1 dist/BaseProvider.d.mts:27-32,83 + dist/utils.d.mts:3 — on/removeListener from @metamask/safe-event-emitter
type MetaMaskRequestArguments = {
    method: string
    params?: unknown[] | Record<string, unknown>
}
type MetaMaskMaybe<Type> = Partial<Type> | null | undefined
interface MetaMaskInpageProvider22 extends NodeEventEmitter {
    readonly chainId: string | null
    readonly selectedAddress: string | null
    readonly networkVersion: string | null
    readonly isMetaMask: true
    isConnected(): boolean
    request<Type>(args: MetaMaskRequestArguments): Promise<MetaMaskMaybe<Type>>
    sendAsync(
        payload: MetaMaskRequestArguments & { id?: number | string | null },
        callback: (error: Error | null, result?: unknown) => void
    ): void
}

// @metamask/providers@16.1.0 dist/types/BaseProvider.d.ts:27-32,84 — same declaration; the version @metamask/sdk@0.34.0 pins
type MetaMaskInpageProvider16 = MetaMaskInpageProvider22

// @metamask/sdk@0.34.0 dist/types/src/provider/SDKProvider.d.ts:30-38 — MetaMaskSDK.getProvider(); getChainId shares its name with a wallet Client action
interface MetaMaskSDKProvider extends MetaMaskInpageProvider16 {
    state: {
        accounts: null | string[]
        isConnected: boolean
        initialized: boolean
        isPermanentlyDisconnected: boolean
        autoRequestAccounts: boolean
        providerStateRequested: boolean
        chainId: string
        networkVersion?: string
    }
    forceInitializeState(): Promise<void>
    getState(): {
        accounts: null | string[]
        isConnected: boolean
        initialized: boolean
        isPermanentlyDisconnected: boolean
    }
    getSelectedAddress(): string | null
    getChainId(): string
    getNetworkVersion(): string | undefined
    handleAccountsChanged(accounts: string[], isEthAccounts?: boolean): void
    handleDisconnect({ terminate }: { terminate: boolean }): void
}

// @walletconnect/ethereum-provider@2.24.0 dist/types/types.d.ts:15-18,22-46 + EthereumProvider.d.ts:85-107 — EthereumProvider.init()
interface WalletConnectRequestArguments {
    method: string
    params?: unknown[] | object
}
type WalletConnectEvent =
    | "connect"
    | "disconnect"
    | "message"
    | "chainChanged"
    | "accountsChanged"
    | "session_delete"
    | "session_event"
    | "session_update"
    | "display_uri"
interface WalletConnectEventArguments {
    connect: { chainId: string }
    disconnect: Error & { code: number; data?: unknown }
    message: { type: string; data: unknown }
    chainChanged: string
    accountsChanged: string[]
    session_delete: { topic: string }
    session_event: {
        id: number
        topic: string
        params: { event: { name: string; data: unknown }; chainId: string }
    }
    session_update: { topic: string }
    display_uri: string
}
type WalletConnectListener = <E extends WalletConnectEvent>(
    event: E,
    listener: (args: WalletConnectEventArguments[E]) => void
) => WalletConnectEthereumProvider
interface WalletConnectEthereumProvider {
    events: NodeEventEmitter
    namespace: string
    accounts: string[]
    chainId: number
    modal?: any
    request<T = unknown>(
        args: WalletConnectRequestArguments,
        expiry?: number
    ): Promise<T>
    sendAsync(
        args: WalletConnectRequestArguments,
        callback: (
            error: Error | null,
            response: { id: number; jsonrpc: string; result: unknown }
        ) => void,
        expiry?: number
    ): void
    readonly connected: boolean
    readonly connecting: boolean
    enable(): Promise<string[]>
    connect(opts?: {
        chains?: number[]
        optionalChains?: number[]
        rpcMap?: Record<number, string>
        pairingTopic?: string
    }): Promise<void>
    disconnect(): Promise<void>
    on: WalletConnectListener
    once: WalletConnectListener
    removeListener: WalletConnectListener
    off: WalletConnectListener
    readonly isWalletConnect: boolean
}

// @wagmi/core@3.6.5 dist/types/connectors/injected.d.ts:94-110 — injected() getProvider(); flags abridged to three
type WagmiWalletProvider = Viem2EIP1193Provider & {
    isMetaMask?: true | undefined
    isCoinbaseWallet?: true | undefined
    isRabby?: true | undefined
    providers?: WagmiWalletProvider[] | undefined
    _events?: { connect?: (() => void) | undefined } | undefined
    _state?:
        | {
              accounts?: string[]
              initialized?: boolean
              isConnected?: boolean
              isPermanentlyDisconnected?: boolean
              isUnlocked?: boolean
          }
        | undefined
}

// mipd@0.0.7 dist/types/register.d.ts:14-19 — EIP6963ProviderDetail['provider']
type MipdEIP6963ProviderDetail = {
    info: { icon: string; name: string; rdns: string; uuid: string }
    provider: Viem2EIP1193Provider
}

// eip1193-provider@1.0.1 dist/cjs/types.d.ts:13-35 — implemented by its EthereumProvider class
interface Eip1193ProviderPkgRequestArguments {
    method: string
    params?: unknown[] | object
}
interface Eip1193ProviderPkgSimpleEventEmitter {
    on(event: string, listener: any): void
    once(event: string, listener: any): void
    removeListener(event: string, listener: any): void
    off(event: string, listener: any): void
}
interface Eip1193ProviderPkgEIP1193Provider
    extends Eip1193ProviderPkgSimpleEventEmitter {
    on(event: "connect", listener: (info: { chainId: string }) => void): void
    on(
        event: "disconnect",
        listener: (error: Error & { code: number; data?: unknown }) => void
    ): void
    on(
        event: "message",
        listener: (message: { type: string; data: unknown }) => void
    ): void
    on(event: "chainChanged", listener: (chainId: string) => void): void
    on(event: "accountsChanged", listener: (accounts: string[]) => void): void
    request(args: Eip1193ProviderPkgRequestArguments): Promise<unknown>
}

// thirdweb@5.121.2 dist/types/adapters/eip1193/types.d.ts:1-5 — EIP1193.toProvider()
type ThirdwebEIP1193Provider = {
    on(event: any, listener: (params: any) => any): void
    removeListener(event: any, listener: (params: any) => any): void
    request: (params: any) => Promise<any>
}

// @getpara/evm-wallet-connectors@3.18.0 dist/types/utils.d.ts:13-29 — WalletProvider; flags abridged to three
type ParaWalletProvider = Viem2EIP1193Provider & {
    isMetaMask?: true | undefined
    isCoinbaseWallet?: true | undefined
    isRabby?: true | undefined
    providers?: any[] | undefined
    _events?: { connect?: (() => void) | undefined } | undefined
    _state?:
        | {
              accounts?: string[]
              initialized?: boolean
              isConnected?: boolean
              isPermanentlyDisconnected?: boolean
              isUnlocked?: boolean
          }
        | undefined
}

// @dynamic-labs/ethereum@5.7.0 src/types.d.ts:19-27 — ethProviderHelper.findProvider(); flags abridged to three
type DynamicIEthereum = {
    isMetaMask: boolean
    isCoinbaseWallet: boolean
    isRabby: boolean
} & {
    providers?: object[]
    request: <T extends string>(
        params: { method: T } | object
    ) => Promise<T extends "eth_requestAccounts" ? [string] : object>
    selectedAddress: string | null
} & EventEmitter3

declare const metaMaskSDKProvider: MetaMaskSDKProvider

describe("EthereumProvider", () => {
    test("is a single method-syntax request, no event members", () => {
        expectTypeOf<keyof EthereumProvider>().toEqualTypeOf<"request">()
        expectTypeOf<OwnerParameter>().not.toBeAny()
    })

    test("method syntax is load-bearing: SDKs narrow params, which only bivariant parameters admit", () => {
        expectTypeOf<{
            request: (args: {
                method: string
                params?: unknown[] | object
            }) => Promise<unknown>
        }>().toExtend<EthereumProvider>()
        expectTypeOf<{
            request(args: {
                method: string
                params?: unknown[] | object
            }): Promise<unknown>
        }>().toExtend<EthereumProvider>()
    })

    test("feeds viem's custom() transport", () => {
        expectTypeOf<EthereumProvider>().toExtend<
            Parameters<typeof custom>[0]
        >()
    })

    test("rejects non-providers", () => {
        expectTypeOf<{ on(): void }>().not.toExtend<OwnerParameter>()
        expectTypeOf<{ request: string }>().not.toExtend<OwnerParameter>()
        expectTypeOf<{
            request(args: { method: string }): string
        }>().not.toExtend<OwnerParameter>()
    })
})

describe("Owner.from accepts every real embedded-wallet provider (22/22)", () => {
    test("viem@2.56.3 EIP1193Provider", () => {
        expectTypeOf<Viem2EIP1193Provider>().toExtend<OwnerParameter>()
    })

    test("viem@3.0.0-next.10 / ox@1.6.2 Provider.Provider", () => {
        expectTypeOf<OxProvider>().toExtend<OwnerParameter>()
    })

    test("viem@3.0.0-next.10 / ox@1.6.2 Provider.Provider<undefined, true>", () => {
        expectTypeOf<OxProviderWithEvents>().toExtend<OwnerParameter>()
    })

    test("@privy-io/react-auth@3.40.0 getEthereumProvider()", () => {
        expectTypeOf<PrivyReactAuthEIP1193Provider>().toExtend<OwnerParameter>()
    })

    test("@privy-io/js-sdk-core@0.73.0 EIP1193Provider", () => {
        expectTypeOf<PrivyCoreEIP1193Provider>().toExtend<OwnerParameter>()
    })

    test("@privy-io/js-sdk-core@0.73.0 PrivyEmbeddedWalletProvider", () => {
        expectTypeOf<PrivyEmbeddedWalletProvider>().toExtend<OwnerParameter>()
    })

    test("@web3auth/base@9.7.0 IProvider", () => {
        expectTypeOf<Web3AuthIProvider>().toExtend<OwnerParameter>()
    })

    test("@web3auth/auth@11.8.3 SafeEventEmitterProvider", () => {
        expectTypeOf<Web3AuthSafeEventEmitterProvider>().toExtend<OwnerParameter>()
    })

    test("magic-sdk@33.13.0 rpcProvider", () => {
        expectTypeOf<MagicRPCProviderModule>().toExtend<OwnerParameter>()
    })

    test("@turnkey/eip-1193-provider@3.4.40 createEIP1193Provider()", () => {
        expectTypeOf<TurnkeyCreateEIP1193Provider>().toExtend<OwnerParameter>()
    })

    test("@turnkey/eip-1193-provider@3.4.40 TurnkeyEIP1193Provider", () => {
        expectTypeOf<TurnkeyEIP1193Provider>().toExtend<OwnerParameter>()
    })

    test("@coinbase/wallet-sdk@4.3.7 ProviderInterface", () => {
        expectTypeOf<CoinbaseProviderInterface>().toExtend<OwnerParameter>()
    })

    test("@metamask/sdk@0.34.0 SDKProvider", () => {
        expectTypeOf<MetaMaskSDKProvider>().toExtend<OwnerParameter>()
        expectTypeOf(Owner.from).toBeCallableWith({
            owner: metaMaskSDKProvider
        })
    })

    test("@metamask/providers@22.1.1 MetaMaskInpageProvider", () => {
        expectTypeOf<MetaMaskInpageProvider22>().toExtend<OwnerParameter>()
    })

    test("@metamask/providers@16.1.0 MetaMaskInpageProvider", () => {
        expectTypeOf<MetaMaskInpageProvider16>().toExtend<OwnerParameter>()
    })

    test("@walletconnect/ethereum-provider@2.24.0 EthereumProvider", () => {
        expectTypeOf<WalletConnectEthereumProvider>().toExtend<OwnerParameter>()
    })

    test("@wagmi/core@3.6.5 injected() getProvider()", () => {
        expectTypeOf<WagmiWalletProvider>().toExtend<OwnerParameter>()
    })

    test("mipd@0.0.7 EIP6963ProviderDetail['provider']", () => {
        expectTypeOf<
            MipdEIP6963ProviderDetail["provider"]
        >().toExtend<OwnerParameter>()
    })

    test("eip1193-provider@1.0.1 EIP1193Provider", () => {
        expectTypeOf<Eip1193ProviderPkgEIP1193Provider>().toExtend<OwnerParameter>()
    })

    test("thirdweb@5.121.2 EIP1193.toProvider()", () => {
        expectTypeOf<ThirdwebEIP1193Provider>().toExtend<OwnerParameter>()
    })

    test("@getpara/evm-wallet-connectors@3.18.0 WalletProvider", () => {
        expectTypeOf<ParaWalletProvider>().toExtend<OwnerParameter>()
    })

    test("@dynamic-labs/ethereum@5.7.0 IEthereum", () => {
        expectTypeOf<DynamicIEthereum>().toExtend<OwnerParameter>()
    })
})

describe("Owner.from keeps the other two arms", () => {
    test("Account.Local", () => {
        expectTypeOf<Account.Local>().toExtend<OwnerParameter>()
    })

    test("wallet Client", () => {
        expectTypeOf<
            Client.Client<Chain.Chain | undefined, Account.Account>
        >().toExtend<OwnerParameter>()
    })

    test("resolves to Account.Local", () => {
        expectTypeOf(Owner.from).returns.resolves.toEqualTypeOf<Account.Local>()
    })
})
