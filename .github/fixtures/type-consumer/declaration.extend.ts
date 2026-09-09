// Known to fail on TypeScript 5.9 / 6.0 / 7.0 (TS2742 / TS2883): `.extend()`
// copies the action bag structurally, so the emitter has to spell out method
// parameter types that live in files the exports map does not reach
// (actions/smartAccount/*, actions/erc7579/*, actions/pimlico/*, types/utils).
// viem closes the same gap with a `./_types/*` export; the decision for
// permissionless is ticket 20's open question.
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
