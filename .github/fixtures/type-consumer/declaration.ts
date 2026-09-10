// Every export is an inferred permissionless value; declaration emit must be
// able to name each type through the package's public entrypoints.
import {
    KernelSmartAccount,
    Nonce,
    Owner,
    SafeSmartAccount,
    SimpleSmartAccount,
    SmartAccountClient
} from "permissionless"
import {
    Erc20Paymaster,
    PasskeyServerClient,
    PimlicoClient
} from "permissionless/pimlico"
import { type Account, type Client, http } from "viem"
import { sepolia } from "viem/chains"

declare const owner: Account.Local
declare const publicClient: ReturnType<typeof Client.create>

export const pimlicoClient = PimlicoClient.create({
    chain: sepolia,
    transport: http("https://bundler.invalid")
})

export const passkeyServerClient = PasskeyServerClient.create({
    transport: http("https://passkeys.invalid")
})

export const safeAccount = await SafeSmartAccount.from({
    client: publicClient,
    owners: [owner]
})

export const kernelAccount = await KernelSmartAccount.from({
    client: publicClient,
    owner,
    eip7702: true
})

export const simpleAccount = await SimpleSmartAccount.from({
    client: publicClient,
    owner,
    entryPoint: "0.7"
})

export const smartAccountClient = SmartAccountClient.create({
    account: safeAccount,
    chain: sepolia,
    bundlerTransport: http("https://bundler.invalid"),
    paymaster: pimlicoClient,
    userOperation: {
        estimateFeesPerGas: async () =>
            (await pimlicoClient.getUserOperationGasPrice()).fast,
        prepareUserOperation: Erc20Paymaster.prepareUserOperation(pimlicoClient)
    }
})

export const paymasterActions = pimlicoClient.paymaster
export const gasPrice = await pimlicoClient.getUserOperationGasPrice()
export const quotes = await pimlicoClient.getTokenQuotes({
    tokens: [owner.address]
})
export const preparedUserOperation =
    await smartAccountClient.userOperation.prepare({
        calls: [{ to: owner.address, value: 0n }]
    })
export const nonce = Nonce.decode(Nonce.encode({ key: 1n, sequence: 2n }))
export const resolvedOwner = await Owner.from({ owner })
export const balanceOverride = Erc20Paymaster.balanceOverride({
    token: owner.address,
    owner: owner.address,
    slot: 0n
})
