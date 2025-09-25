import {
    type SmartAccountClient,
    createSmartAccountClient
} from "permissionless"
import {
    type ToKernelSmartAccountReturnType,
    type ToSafeSmartAccountReturnType,
    toKernelSmartAccount,
    toSafeSmartAccount
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
    parseEther,
    zeroAddress
} from "viem"
import {
    type P256Credential,
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

function KernelSmartAccountDemo() {
    const [smartAccountClient, setSmartAccountClient] =
        React.useState<
            SmartAccountClient<
                Transport,
                Chain,
                ToKernelSmartAccountReturnType<"0.7">
            >
        >()
    const [credential, setCredential] = React.useState<P256Credential>(() =>
        JSON.parse(localStorage.getItem("credential_kernel") || "null")
    )

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
                    bundlerTransport: http(pimlicoUrl, {
                        onFetchRequest: async (r) =>
                            console.log(await r.clone().json())
                    }) // Use any bundler url
                })
            )
        })
    }, [credential])

    const createCredential = async () => {
        const credential = await createWebAuthnCredential({
            name: "Wallet"
        })
        localStorage.setItem("credential_kernel", JSON.stringify(credential))
        setCredential(credential)
    }

    const sendUserOperation = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()
        if (!smartAccountClient) return

        const to = zeroAddress
        const value = "0"

        const { id: hash } = await smartAccountClient.sendCalls({
            calls: [
                {
                    to,
                    value: parseEther(value)
                }
            ],
            paymaster: true
        })
        setUserOpHash(hash as Hex)

        let receipt = await smartAccountClient.getCallsStatus({
            id: hash
        })
        while (receipt.status === "pending") {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            receipt = await smartAccountClient.getCallsStatus({
                id: hash
            })
        }
        setHash(receipt.receipts?.[0].transactionHash)
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
                <h2>Kernel Account</h2>
                <button type="button" onClick={createCredential}>
                    Create credential
                </button>
            </>
        )
    if (!smartAccountClient) return <p>Loading...</p>

    return (
        <>
            <h2>Kernel Account</h2>
            <p>Address: {smartAccountClient?.account?.address}</p>

            <h2>Send User Operation</h2>
            <form onSubmit={sendUserOperation}>
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

function SafeSmartAccountDemo() {
    const [smartAccountClient, setSmartAccountClient] =
        React.useState<
            SmartAccountClient<
                Transport,
                Chain,
                ToSafeSmartAccountReturnType<"0.7">
            >
        >()
    const [credential, setCredential] = React.useState<P256Credential>(() =>
        JSON.parse(localStorage.getItem("credential_safe") || "null")
    )

    const [hash, setHash] = React.useState<Hex>()
    const [userOpHash, setUserOpHash] = React.useState<Hex>()
    const [signature, setSignature] = React.useState<Hex>()
    const [isVerified, setIsVerified] = React.useState<boolean>()
    const [signatureTypedData, setSignatureTypedData] = React.useState<Hex>()
    const [isVerifiedTypedData, setIsVerifiedTypedData] =
        React.useState<boolean>()

    React.useEffect(() => {
        if (!credential) return
        toSafeSmartAccount({
            client: publicClient,
            version: "1.4.1",
            owners: [toWebAuthnAccount({ credential })],
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            }
        }).then((account: ToSafeSmartAccountReturnType<"0.7">) => {
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
        localStorage.setItem("credential_safe", JSON.stringify(credential))
        setCredential(credential)
    }

    const sendUserOperation = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()
        if (!smartAccountClient) return

        const to = zeroAddress
        const value = "0"

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
                <h2>Safe Account</h2>
                <button type="button" onClick={createCredential}>
                    Create credential
                </button>
            </>
        )
    if (!smartAccountClient) return <p>Loading...</p>

    return (
        <>
            <h2>Safe Account</h2>
            <p>Address: {smartAccountClient?.account?.address}</p>

            <h2>Send User Operation</h2>
            <form onSubmit={sendUserOperation}>
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

export function PasskeysDemo({
    path,
    handleSelection
}: {
    path: string
    handleSelection: (
        component:
            | "app"
            | "passkey"
            | "passkeyServer"
            | "temp"
            | "passkey/kernel"
            | "passkey/safe"
    ) => void
}) {
    if (path === "/passkey") {
        return (
            <div>
                <button
                    type="button"
                    style={{ marginRight: "10px" }}
                    onClick={() => handleSelection("passkey/kernel")}
                >
                    Create kernel smart account
                </button>
                <button
                    type="button"
                    style={{ marginRight: "10px" }}
                    onClick={() => handleSelection("passkey/safe")}
                >
                    Create Safe smart account
                </button>
            </div>
        )
    }
    if (path === "/passkey/kernel") {
        return <KernelSmartAccountDemo />
    }
    return <SafeSmartAccountDemo />
}
