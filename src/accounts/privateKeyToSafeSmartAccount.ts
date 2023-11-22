import {
    type Address,
    type Chain,
    type Client,
    type Hex,
    type Transport
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import {
    type SafeSmartAccount,
    type SafeVersion,
    signerToSafeSmartAccount
} from "./signerToSafeSmartAccount.js"

/**
 * @description Creates an Simple Account from a private key.
 *
 * @returns A Private Key Simple Account.
 */
export async function privateKeyToSafeSmartAccount<
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain>,
    {
        privateKey,
        safeVersion,
        entryPoint,
        addModuleLibAddress: _addModuleLibAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress,
        saltNonce = 0n,
        safeModules = [],
        setupTransactions = []
    }: {
        safeVersion: SafeVersion
        privateKey: Hex
        entryPoint: Address
        addModuleLibAddress?: Address
        safe4337ModuleAddress?: Address
        safeProxyFactoryAddress?: Address
        safeSingletonAddress?: Address
        multiSendAddress?: Address
        multiSendCallOnlyAddress?: Address
        saltNonce?: bigint
        setupTransactions?: {
            to: Address
            data: Address
            value: bigint
        }[]
        safeModules?: Address[]
    }
): Promise<SafeSmartAccount<TTransport, TChain>> {
    const privateKeyAccount = privateKeyToAccount(privateKey)

    return signerToSafeSmartAccount(client, {
        smartAccountSigner: privateKeyAccount,
        safeVersion,
        entryPoint,
        addModuleLibAddress: _addModuleLibAddress,
        safe4337ModuleAddress: _safe4337ModuleAddress,
        safeProxyFactoryAddress: _safeProxyFactoryAddress,
        safeSingletonAddress: _safeSingletonAddress,
        multiSendAddress: _multiSendAddress,
        multiSendCallOnlyAddress: _multiSendCallOnlyAddress,
        saltNonce,
        safeModules,
        setupTransactions
    })
}
