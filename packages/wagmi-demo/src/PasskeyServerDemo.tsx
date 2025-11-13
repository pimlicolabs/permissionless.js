import {
    type SmartAccountClient,
    createSmartAccountClient
} from "permissionless"
import {
    type ToKernelSmartAccountReturnType,
    toKernelSmartAccount
} from "permissionless/accounts"
import { createPasskeyServerClient } from "permissionless/clients/passkeyServer"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import { getOxExports } from "permissionless/utils"
import * as React from "react"
import {
    http,
    type Chain,
    type Hex,
    type Transport,
    createPublicClient,
    getAddress,
    parseEther
} from "viem"
import {
    createWebAuthnCredential,
    entryPoint07Address,
    toWebAuthnAccount
} from "viem/account-abstraction"
import { baseSepolia } from "viem/chains"
import { pimlicoApiKey } from "./wagmi"

const chain = baseSepolia
const pimlicoUrl = `https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${pimlicoApiKey}`

const typedData = {
    domain: {
        name: "Ether Mail",
        version: "1",
        chainId: 1,
        verifyingContract: getAddress(
            "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
        )
    },
    types: {
        Person: [
            { name: "name", type: "string" },
            { name: "wallet", type: "address" }
        ],
        Mail: [
            { name: "from", type: "Person" },
            { name: "to", type: "Person" },
            { name: "contents", type: "string" }
        ]
    },
    primaryType: "Mail" as const,
    message: {
        from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
        },
        to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
        },
        contents: "Hello, Bob!"
    }
}

const publicClient = createPublicClient({
    chain,
    transport: http("https://sepolia.base.org")
})

const pimlicoClient = createPimlicoClient({
    chain,
    transport: http(pimlicoUrl)
})

const passkeyServerClient = createPasskeyServerClient({
    chain,
    transport: http(
        `https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${pimlicoApiKey}`
    )
})

export function PasskeyServerDemo() {
    const [smartAccountClient, setSmartAccountClient] =
        React.useState<
            SmartAccountClient<
                Transport,
                Chain,
                ToKernelSmartAccountReturnType<"0.7">
            >
        >()
    const [credential, setCredential] = React.useState<{
        id: string
        publicKey: Hex
    }>()

    const [hash, setHash] = React.useState<Hex>()
    const [userOpHash, setUserOpHash] = React.useState<Hex>()
    const [signature, setSignature] = React.useState<Hex>()
    const [isVerified, setIsVerified] = React.useState<boolean>()
    const [signatureTypedData, setSignatureTypedData] = React.useState<Hex>()
    const [isVerifiedTypedData, setIsVerifiedTypedData] =
        React.useState<boolean>()

    React.useEffect(() => {
        if (!credential) return
        toKernelSmartAccount({
            client: publicClient,
            version: "0.3.1",
            owners: [toWebAuthnAccount({ credential })],
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            }
        }).then((account: ToKernelSmartAccountReturnType<"0.7">) => {
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
        const userName = crypto.randomUUID()
        const credential = await createWebAuthnCredential(
            await passkeyServerClient.startRegistration({
                context: {
                    userName
                }
            })
        )
        const verifiedCredential = await passkeyServerClient.verifyRegistration(
            {
                credential,
                context: {
                    userName
                }
            }
        )

        setCredential(verifiedCredential)
    }

    const loginCredential = async () => {
        const credentials = await passkeyServerClient.startAuthentication()

        const { WebAuthnP256 } = await getOxExports()
        const response = await WebAuthnP256.sign(credentials)

        const verifiedCredential =
            await passkeyServerClient.verifyAuthentication({
                ...response,
                uuid: credentials.uuid
            })

        setCredential(verifiedCredential)
    }

    const sendUserOperation = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()
        if (!smartAccountClient) return

        const formData = new FormData(event.currentTarget)
        const to = formData.get("to") as Hex
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

    const signMessage = async () => {
        if (!smartAccountClient) return
        const message = "Hello, world!"
        const signature = await smartAccountClient.signMessage({
            message
        })

        const isVerified = await publicClient.verifyMessage({
            address: smartAccountClient.account.address,
            message,
            signature
        })

        setSignature(signature)
        setIsVerified(isVerified)
    }

    const signTypedData = async () => {
        if (!smartAccountClient) return
        const signature = await smartAccountClient.signTypedData(typedData)

        const isVerified = await publicClient.verifyTypedData({
            ...typedData,
            address: smartAccountClient.account.address,
            signature
        })
        setIsVerifiedTypedData(isVerified)
        setSignatureTypedData(signature)
    }

    if (!credential)
        return (
            <>
                <h2>Account</h2>
                <button type="button" onClick={loginCredential}>
                    Use existing credential
                </button>
                <button
                    style={{ marginLeft: 8 }}
                    type="button"
                    onClick={createCredential}
                >
                    Create credential
                </button>
            </>
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

            <h2>Sign message</h2>
            <button type="button" onClick={signMessage}>
                Sign message Test
            </button>
            {signature && (
                <p>
                    Signature: <pre>{signature}</pre>
                </p>
            )}
            {isVerified !== undefined && (
                <p>Verified: {isVerified.toString()}</p>
            )}

            <h2>Sign typed data</h2>
            <button type="button" onClick={signTypedData}>
                Sign typed data Test
            </button>
            {signatureTypedData && (
                <p>
                    Signature: <pre>{signatureTypedData}</pre>
                </p>
            )}
            {isVerifiedTypedData !== undefined && (
                <p>Verified: {isVerifiedTypedData.toString()}</p>
            )}
        </>
    )
}
