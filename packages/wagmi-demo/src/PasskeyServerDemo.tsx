import { Base64 } from "ox"
import {
    type SmartAccountClient,
    createSmartAccountClient,
    startWebAuthnRegistration,
    verifyWebAuthnRegistration
} from "permissionless"
import {
    type ToKernelSmartAccountReturnType,
    toKernelSmartAccount
} from "permissionless/accounts"
import { createPimlicoClient } from "permissionless/clients/pimlico"
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
    type CreateWebAuthnCredentialParameters,
    type CreateWebAuthnCredentialReturnType,
    type P256Credential,
    createWebAuthnCredential,
    entryPoint07Address,
    toWebAuthnAccount
} from "viem/account-abstraction"
import { baseSepolia } from "viem/chains"
import { z } from "zod"

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
        const credential = await createWebAuthnCredential(
            await startWebAuthnRegistration({
                passKeyServerUrl: `http://0.0.0.0:8080/v2/passkeys/register/options?apikey=${pimlicoApiKey}`,
                userName: "plusminushalf"
            })
        )
        const verifiedCredential = await verifyWebAuthnRegistration({
            passKeyServerUrl: `http://0.0.0.0:8080/v2/passkeys/register/verify?apikey=${pimlicoApiKey}`,
            credential,
            userName: "plusminushalf"
        })

        console.log({ verifiedCredential })

        setCredential(verifiedCredential)
    }

    const fetchPasskeys = async ({
        userName
    }: {
        userName: string
    }) => {
        const response = await fetch(
            `http://0.0.0.0:8080/v2/passkeys/${userName}?apikey=${pimlicoApiKey}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )

        if (!response.ok) {
            console.error("Failed to register:", response.statusText)
        } else {
            console.log("Registration successful")
        }

        return response.json()
    }

    const loginCredential = async () => {
        const options = await fetchPasskeys({
            userName: "plusminushalf"
        })
        console.log(options.passkeys)

        setCredential(options.passkeys[0])
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
