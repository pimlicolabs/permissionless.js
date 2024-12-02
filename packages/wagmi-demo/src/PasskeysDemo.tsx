import {
    type SmartAccountClient,
    createSmartAccountClient
} from "permissionless"
import { toKernelSmartAccount } from "permissionless/accounts"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import * as React from "react"
import { http, type Hex, createPublicClient, parseEther } from "viem"
import {
    type P256Credential,
    createWebAuthnCredential,
    toWebAuthnAccount
} from "viem/account-abstraction"
import { sepolia } from "viem/chains"

const chain = sepolia
const pimlicoApiKey = PIMLICO_API_KEY
const pimlicoUrl = `https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${pimlicoApiKey}`

const publicClient = createPublicClient({
    chain,
    transport: http("https://sepolia.base.org")
})

const pimlicoClient = createPimlicoClient({
    chain,
    transport: http(pimlicoUrl)
})

export function PasskeysDemo() {
    const [smartAccountClient, setSmartAccountClient] =
        React.useState<SmartAccountClient>()
    const [credential, setCredential] = React.useState<P256Credential>(() =>
        JSON.parse(localStorage.getItem("credential") || "null")
    )

    const [hash, setHash] = React.useState<Hex>()
    const [userOpHash, setUserOpHash] = React.useState<Hex>()

    React.useEffect(() => {
        if (!credential) return
        toKernelSmartAccount({
            client: publicClient,
            version: "0.3.1",
            owners: [toWebAuthnAccount({ credential })]
        }).then((account) => {
            setSmartAccountClient(
                createSmartAccountClient({
                    account,
                    paymaster: pimlicoClient,
                    chain,
                    userOperation: {
                        estimateFeesPerGas: async () =>
                            (await pimlicoClient.getUserOperationGasPrice())
                                .fast
                    },
                    bundlerTransport: http(pimlicoUrl) // Use any bundler url
                })
            )
        })
    }, [credential])

    const createCredential = async () => {
        const credential = await createWebAuthnCredential({
            name: "Wallet"
        })
        localStorage.setItem("credential", JSON.stringify(credential))
        setCredential(credential)
    }

    const sendUserOperation = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()
        if (!smartAccountClient) return

        const formData = new FormData(event.currentTarget)
        const to = formData.get("to") as `0x${string}`
        const value = formData.get("value") as string

        const hash = await smartAccountClient.sendUserOperation({
            calls: [
                {
                    to,
                    value: parseEther(value)
                }
            ],
            paymaster: true
        })
        setUserOpHash(hash)

        const { receipt } =
            await smartAccountClient.waitForUserOperationReceipt({
                hash
            })
        setHash(receipt.transactionHash)
    }

    if (!credential)
        return (
            <button type="button" onClick={createCredential}>
                Create credential
            </button>
        )
    if (!smartAccountClient) return <p>Loading...</p>

    return (
        <>
            <h2>Account</h2>
            <p>Address: {smartAccountClient?.account?.address}</p>

            <h2>Send User Operation</h2>
            <form onSubmit={sendUserOperation}>
                <input name="to" placeholder="Address" />
                <input name="value" placeholder="Amount (ETH)" />
                <button type="submit">Send</button>
                {userOpHash && <p>User Operation Hash: {userOpHash}</p>}
                {hash && <p>Transaction Hash: {hash}</p>}
            </form>
        </>
    )
}
