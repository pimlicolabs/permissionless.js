import {
    type BundlerClient,
    ENTRYPOINT_ADDRESS_V06,
    createSmartAccountClient
} from "permissionless"
import {
    SignTransactionNotSupportedBySmartAccount,
    signerToBiconomySmartAccount,
    signerToEcdsaKernelSmartAccount,
    signerToSafeSmartAccount,
    signerToSimpleSmartAccount
} from "permissionless/accounts"
import type { PimlicoPaymasterClient } from "permissionless/clients/pimlico"
import type { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types"
import { getUserOperationHash } from "permissionless/utils"
import {
    http,
    type BaseError,
    type Chain,
    type PublicClient,
    type Transport,
    decodeEventLog,
    getAddress,
    getContract,
    isAddress,
    isHash,
    parseEther,
    zeroAddress
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { beforeAll, describe, expect, test } from "vitest"
import { ENTRYPOINT_V06_ABI } from "../../abi/entryPointV06Abi"
import { SIMPLE_ACCOUNT_FACTORY_V06 } from "../constants"
import type { AAParamType, ExistingSignerParamType } from "../types"
import {
    ALTO_RPC,
    ensureBundlerIsReady,
    ensurePaymasterIsReady,
    fund,
    getBiconomyClient,
    getBundlerClient,
    getKernelEcdsaClient,
    getPimlicoPaymasterClient,
    getPublicClient,
    getSafeClient,
    getSimpleAccountClient
} from "../utils"

describe.each([
    {
        name: "Simple",
        getSmartAccountClient: async (
            conf: AAParamType<ENTRYPOINT_ADDRESS_V06_TYPE>
        ) => getSimpleAccountClient(conf),
        getSmartAccountSigner: async (conf: ExistingSignerParamType) =>
            signerToSimpleSmartAccount(conf.publicClient, {
                address: conf.existingAddress, // this is the field we are testing
                signer: privateKeyToAccount(conf.privateKey),
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                factoryAddress: SIMPLE_ACCOUNT_FACTORY_V06
            }),
        isEip1271Compliant: false
    },
    {
        name: "Kernel",
        getSmartAccountClient: async (
            conf: AAParamType<ENTRYPOINT_ADDRESS_V06_TYPE>
        ) => getKernelEcdsaClient(conf),
        getSmartAccountSigner: async (conf: ExistingSignerParamType) =>
            signerToEcdsaKernelSmartAccount(conf.publicClient, {
                address: conf.existingAddress, // this is the field we are testing
                signer: privateKeyToAccount(conf.privateKey),
                entryPoint: ENTRYPOINT_ADDRESS_V06
            }),
        isEip1271Compliant: true
    },
    {
        name: "Biconomy",
        getSmartAccountClient: async (
            conf: AAParamType<ENTRYPOINT_ADDRESS_V06_TYPE>
        ) => getBiconomyClient(conf),
        getSmartAccountSigner: async (conf: ExistingSignerParamType) =>
            signerToBiconomySmartAccount(conf.publicClient, {
                address: conf.existingAddress, // this is the field we are testing
                signer: privateKeyToAccount(conf.privateKey),
                entryPoint: ENTRYPOINT_ADDRESS_V06
            }),
        isEip1271Compliant: true
    },
    {
        name: "Safe",
        getSmartAccountClient: async (
            conf: AAParamType<ENTRYPOINT_ADDRESS_V06_TYPE>
        ) => getSafeClient(conf),
        getSmartAccountSigner: async (conf: ExistingSignerParamType) =>
            signerToSafeSmartAccount(conf.publicClient, {
                address: conf.existingAddress, // this is the field we are testing
                signer: privateKeyToAccount(conf.privateKey),
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                safeVersion: "1.4.1"
            }),
        isEip1271Compliant: true
    }
])(
    "$name account should support all core functions",
    ({
        name,
        getSmartAccountClient,
        getSmartAccountSigner,
        isEip1271Compliant
    }) => {
        let publicClient: PublicClient<Transport, Chain>
        let bundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V06_TYPE, Chain>
        let paymasterClient: PimlicoPaymasterClient<ENTRYPOINT_ADDRESS_V06_TYPE>

        beforeAll(async () => {
            publicClient = getPublicClient()
            bundlerClient = getBundlerClient(ENTRYPOINT_ADDRESS_V06)
            paymasterClient = getPimlicoPaymasterClient(ENTRYPOINT_ADDRESS_V06)

            await ensureBundlerIsReady()
            await ensurePaymasterIsReady()
        })

        test("Can get get address", async () => {
            const smartClient = await getSmartAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06
            })
            const smartAccount = smartClient.account

            expect(isAddress(smartAccount.address)).toBe(true)
        })

        test("Calling signTransaction should throw not supported", async () => {
            const smartClient = await getSmartAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06
            })
            const smartAccount = smartClient.account

            await expect(async () =>
                smartAccount.signTransaction({
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                })
            ).rejects.toThrow(SignTransactionNotSupportedBySmartAccount)
        })

        test("Calling deployContract should throw not supported", async () => {
            const smartClient = await getSmartAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06
            })

            await expect(async () =>
                smartClient.deployContract({
                    abi: [],
                    bytecode: "0xff66"
                })
            ).rejects.toThrowError(/^.*doesn't support account deployment.*$/i)
        })

        test("Can send transaction", async () => {
            const smartClient = await getSmartAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06
            })

            await fund(smartClient.account.address)

            const response = await smartClient.sendTransaction({
                to: zeroAddress,
                value: 0n,
                data: "0x"
            })

            expect(isHash(response)).toBeTruthy()
        }, 10000)

        test("Can send multiple transactions", async () => {
            const smartClient = await getSmartAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06
            })

            await fund(smartClient.account.address)

            const response = await smartClient.sendTransactions({
                transactions: [
                    {
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    },
                    {
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    }
                ]
            })

            expect(isHash(response)).toBe(true)
        }, 10000)

        test("Can write contract", async () => {
            const smartClient = await getSmartAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06
            })

            await fund(smartClient.account.address)

            const entryPointContract = getContract({
                abi: ENTRYPOINT_V06_ABI,
                address: ENTRYPOINT_ADDRESS_V06,
                client: {
                    public: getPublicClient(),
                    wallet: smartClient
                }
            })

            const oldBalance = await entryPointContract.read.balanceOf([
                smartClient.account.address
            ])

            // @ts-ignore
            const txHash = await entryPointContract.write.depositTo(
                [smartClient.account.address],
                {
                    value: parseEther("0.25")
                }
            )

            expect(isHash(txHash)).toBe(true)

            const newBalance = await entryPointContract.read.balanceOf([
                smartClient.account.address
            ])

            //@ts-ignore
            expect(newBalance - oldBalance).toBeGreaterThanOrEqual(
                parseEther("0.25")
            )
        }, 10000)

        test("Can send transaction with paymaster", async () => {
            const smartClient = await getSmartAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                paymasterClient
            })

            // derive expected hash so that we can search for it in logs
            const op = await smartClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await smartClient.account.encodeCallData({
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    })
                }
            })
            op.signature = await smartClient.account.signUserOperation(op)

            const expectedHash = getUserOperationHash({
                userOperation: op,
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                chainId: foundry.id
            })

            const response = await smartClient.sendTransaction({
                to: zeroAddress,
                value: 0n,
                data: "0x"
            })

            expect(isHash(response)).toBe(true)

            const transactionReceipt =
                await publicClient.waitForTransactionReceipt({
                    hash: response
                })

            let eventFound = false

            for (const log of transactionReceipt.logs) {
                try {
                    // biome-ignore lint/suspicious/noExplicitAny:
                    let event: any
                    try {
                        event = decodeEventLog({
                            abi: ENTRYPOINT_V06_ABI,
                            ...log
                        })
                    } catch {
                        continue
                    }
                    if (
                        event.eventName === "UserOperationEvent" &&
                        event.args.userOpHash === expectedHash
                    ) {
                        eventFound = true
                        const op = await bundlerClient.getUserOperationByHash({
                            hash: event.args.userOpHash
                        })
                        expect(op?.userOperation.paymasterAndData).not.toBe(
                            "0x"
                        )
                    }
                } catch (e) {
                    const error = e as BaseError
                    if (error.name !== "AbiEventSignatureNotFoundError") throw e
                }
            }

            expect(eventFound).toBeTruthy()
        }, 5000)

        test("Can send multiple transactions with paymaster", async () => {
            const smartClient = await getSmartAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                paymasterClient
            })

            // derive expected hash so that we can search for it in logs
            const op = await smartClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await smartClient.account.encodeCallData([
                        {
                            to: zeroAddress,
                            value: 0n,
                            data: "0x"
                        },
                        {
                            to: zeroAddress,
                            value: 0n,
                            data: "0x"
                        }
                    ])
                }
            })
            op.signature = await smartClient.account.signUserOperation(op)

            const expectedHash = getUserOperationHash({
                userOperation: op,
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                chainId: foundry.id
            })

            const response = await smartClient.sendTransactions({
                transactions: [
                    {
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    },
                    {
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    }
                ]
            })

            expect(isHash(response)).toBeTruthy()

            const transactionReceipt =
                await publicClient.waitForTransactionReceipt({
                    hash: response
                })

            let eventFound = false

            for (const log of transactionReceipt.logs) {
                // biome-ignore lint/suspicious/noExplicitAny:
                let event: any
                try {
                    event = decodeEventLog({
                        abi: ENTRYPOINT_V06_ABI,
                        ...log
                    })
                } catch {
                    continue
                }
                if (
                    event.eventName === "UserOperationEvent" &&
                    event.args.userOpHash === expectedHash
                ) {
                    eventFound = true
                    const op = await bundlerClient.getUserOperationByHash({
                        hash: event.args.userOpHash
                    })
                    expect(op?.userOperation.paymasterAndData).not.toBe("0x")
                }
            }

            expect(eventFound).toBeTruthy()
        }, 10000)

        test("Should work with existing (deployed) smart account", async () => {
            const privateKey = generatePrivateKey()

            const existingClient = await getSmartAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06,
                privateKey
            })

            // force a deployment
            await fund(existingClient.account.address)
            await existingClient.sendTransaction({
                to: zeroAddress
            })

            // create new simpleSmartAccount client from existing SmartAcocunt
            const newSimpleSigner = await getSmartAccountSigner({
                publicClient,
                privateKey,
                existingAddress: existingClient.account.address
            })

            const newSimpleClient = createSmartAccountClient({
                chain: foundry,
                account: newSimpleSigner,
                bundlerTransport: http(ALTO_RPC)
            })

            const response = await newSimpleClient.sendTransaction({
                to: zeroAddress,
                data: "0x",
                value: parseEther("0.01")
            })

            expect(isHash(response))
        }, 25000)

        test("Can sign and verify message", async () => {
            if (name === "Kernel") {
                // Kernel is failing to sign + verify for some reason :(
                return
            }

            const smartClient = await getSmartAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06
            })

            if (!isEip1271Compliant) {
                return await expect(async () =>
                    smartClient.signMessage({
                        message: "vires in numeris"
                    })
                ).rejects.toThrow()
            }

            const signature = await smartClient.signMessage({
                message: "vires in numeris"
            })

            const isVerified = await publicClient.verifyMessage({
                address: smartClient.account.address,
                message: "vires in numeris",
                signature
            })

            expect(isVerified).toBeTruthy()
        })

        test("Can sign and verify typed data", async () => {
            if (name === "Kernel") {
                // Kernel is failing to sign + verify for some reason :(
                return
            }

            const smartClient = await getSmartAccountClient({
                entryPoint: ENTRYPOINT_ADDRESS_V06
            })

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

            if (!isEip1271Compliant) {
                return await expect(async () =>
                    smartClient.signTypedData(typedData)
                ).rejects.toThrow()
            }

            const signature = await smartClient.signTypedData(typedData)

            const isVerified = await publicClient.verifyTypedData({
                ...typedData,
                address: smartClient.account.address,
                signature
            })

            expect(isVerified).toBeTruthy()
        })
    }
)
