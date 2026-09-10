// `.extend()` copies the action bag structurally, so the emitter has to spell
// out method parameter types that live in files no entrypoint reaches
// (actions/smartAccount/*, actions/erc7579/*, actions/pimlico/*, types/utils).
// The `./_types/*` export lets tsc name them as `permissionless/_types/<path>`;
// without it this file fails TS2742 (TS 5/6) / TS2883 (TS 7).
import {
    erc7579Actions,
    SafeSmartAccount,
    SmartAccountClient
} from "permissionless"
import { PimlicoClient } from "permissionless/pimlico"
import { type Account, type Client, http } from "viem"
import { sepolia } from "viem/chains"

declare const owner: Account.Local
declare const publicClient: ReturnType<typeof Client.create>

const pimlicoClient = PimlicoClient.create({
    chain: sepolia,
    transport: http("https://bundler.invalid")
})
const smartAccountClient = SmartAccountClient.create({
    account: await SafeSmartAccount.from({
        client: publicClient,
        owners: [owner]
    }),
    chain: sepolia,
    bundlerTransport: http("https://bundler.invalid")
})

export const erc7579Client = smartAccountClient.extend(erc7579Actions())
export const extendedPimlicoClient = pimlicoClient.extend(() => ({}))
export const sendTransaction = smartAccountClient.sendTransaction
export const sponsorUserOperation = pimlicoClient.sponsorUserOperation
