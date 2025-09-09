import { http, parseEther, zeroAddress } from "viem"
import {
    entryPoint06Address,
    entryPoint07Address,
    entryPoint08Address
} from "viem/account-abstraction"
import { privateKeyToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import {
    erc20Address,
    sudoMintTokens,
    tokenBalanceOf
} from "../../../../mock-paymaster/helpers/erc20-utils"
import { testWithRpc } from "../../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../../permissionless-test/src/utils"
import { createSmartAccountClient } from "../../../clients/createSmartAccountClient"
import { createPimlicoClient } from "../../../clients/pimlico"
import { prepareUserOperationForErc20Paymaster } from "./prepareUserOperationForErc20Paymaster"

const privateKey =
    "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"

describe.each(getCoreSmartAccounts())(
    "prepareUserOperationForErc20Paymaster $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07,
        supportsEntryPointV08,
        isEip7702Compliant,
        name
    }) => {
        testWithRpc.skipIf(!supportsEntryPointV06 || name === "Kernel 0.2.1")(
            "prepareUserOperationForErc20Paymaster_v06",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const account = (
                    await getSmartAccountClient({
                        entryPoint: {
                            version: "0.6"
                        },
                        privateKey,
                        ...rpc
                    })
                ).account

                const pimlicoClient = createPimlicoClient({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: entryPoint06Address,
                        version: "0.6"
                    }
                })

                const publicClient = getPublicClient(anvilRpc)

                const smartAccountClient = createSmartAccountClient({
                    // @ts-ignore
                    client: getPublicClient(anvilRpc),
                    account,
                    paymaster: pimlicoClient,
                    chain: foundry,
                    userOperation: {
                        prepareUserOperation:
                            prepareUserOperationForErc20Paymaster(pimlicoClient)
                    },
                    bundlerTransport: http(rpc.altoRpc)
                })

                const INITIAL_TOKEN_BALANCE = parseEther("100")
                const INTIAL_ETH_BALANCE = await publicClient.getBalance({
                    address: smartAccountClient.account.address
                })

                sudoMintTokens({
                    amount: INITIAL_TOKEN_BALANCE,
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const opHash = await smartAccountClient.sendUserOperation({
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ],
                    paymasterContext: {
                        token: erc20Address
                    }
                })

                const receipt =
                    await smartAccountClient.waitForUserOperationReceipt({
                        hash: opHash
                    })

                expect(receipt).toBeTruthy()
                expect(receipt).toBeTruthy()

                expect(receipt.success).toBeTruthy()
                const FINAL_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )
                const FINAL_ETH_BALANCE = await publicClient.getBalance({
                    address: smartAccountClient.account.address
                })

                expect(FINAL_TOKEN_BALANCE).toBeLessThan(INITIAL_TOKEN_BALANCE) // Token balance should be deducted
                expect(FINAL_ETH_BALANCE).toEqual(INTIAL_ETH_BALANCE) // There should be no ETH balance change
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "prepareUserOperationForErc20Paymaster_v07",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = privateKeyToAccount(privateKey)

                const account = (
                    await getSmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        privateKey,
                        ...rpc
                    })
                ).account

                const publicClient = getPublicClient(anvilRpc)

                const pimlicoClient = createPimlicoClient({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: entryPoint07Address,
                        version: "0.7"
                    }
                })

                const smartAccountClient = createSmartAccountClient({
                    // @ts-ignore
                    client: getPublicClient(anvilRpc),
                    account,
                    paymaster: pimlicoClient,
                    chain: foundry,
                    userOperation: {
                        prepareUserOperation:
                            prepareUserOperationForErc20Paymaster(pimlicoClient)
                    },
                    bundlerTransport: http(rpc.altoRpc)
                })

                const INITIAL_TOKEN_BALANCE = parseEther("100")
                const INTIAL_ETH_BALANCE = await publicClient.getBalance({
                    address: smartAccountClient.account.address
                })

                sudoMintTokens({
                    amount: INITIAL_TOKEN_BALANCE,
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const authorization = isEip7702Compliant
                    ? await privateKeyAccount.signAuthorization({
                          address: (smartAccountClient.account as any)
                              .implementation,
                          chainId: smartAccountClient.chain.id,
                          nonce: await publicClient.getTransactionCount({
                              address: smartAccountClient.account.address
                          })
                      })
                    : undefined

                const opHash = await smartAccountClient.sendUserOperation({
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ],
                    paymasterContext: {
                        token: erc20Address
                    },
                    authorization
                })

                const receipt =
                    await smartAccountClient.waitForUserOperationReceipt({
                        hash: opHash
                    })

                expect(receipt).toBeTruthy()
                expect(receipt).toBeTruthy()
                expect(receipt.success).toBeTruthy()

                const FINAL_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )
                const FINAL_ETH_BALANCE = await publicClient.getBalance({
                    address: smartAccountClient.account.address
                })

                expect(FINAL_TOKEN_BALANCE).toBeLessThan(INITIAL_TOKEN_BALANCE) // Token balance should be deducted
                expect(FINAL_ETH_BALANCE).toEqual(INTIAL_ETH_BALANCE) // There should be no ETH balance change
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV08)(
            "prepareUserOperationForErc20Paymaster_v08",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = privateKeyToAccount(privateKey)

                const account = (
                    await getSmartAccountClient({
                        entryPoint: {
                            version: "0.8"
                        },
                        privateKey,
                        ...rpc
                    })
                ).account

                const publicClient = getPublicClient(anvilRpc)

                const pimlicoClient = createPimlicoClient({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: entryPoint08Address,
                        version: "0.8"
                    }
                })

                const smartAccountClient = createSmartAccountClient({
                    // @ts-ignore
                    client: getPublicClient(anvilRpc),
                    account,
                    paymaster: pimlicoClient,
                    chain: foundry,
                    userOperation: {
                        prepareUserOperation:
                            prepareUserOperationForErc20Paymaster(pimlicoClient)
                    },
                    bundlerTransport: http(rpc.altoRpc)
                })

                const INITIAL_TOKEN_BALANCE = parseEther("100")
                const INTIAL_ETH_BALANCE = await publicClient.getBalance({
                    address: smartAccountClient.account.address
                })

                sudoMintTokens({
                    amount: INITIAL_TOKEN_BALANCE,
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const authorization = isEip7702Compliant
                    ? await privateKeyAccount.signAuthorization({
                          address: (smartAccountClient.account as any)
                              .implementation,
                          chainId: smartAccountClient.chain.id,
                          nonce: await publicClient.getTransactionCount({
                              address: smartAccountClient.account.address
                          })
                      })
                    : undefined

                const opHash = await smartAccountClient.sendUserOperation({
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ],
                    paymasterContext: {
                        token: erc20Address
                    },
                    authorization
                })

                const receipt =
                    await smartAccountClient.waitForUserOperationReceipt({
                        hash: opHash
                    })

                expect(receipt).toBeTruthy()
                expect(receipt).toBeTruthy()
                expect(receipt.success).toBeTruthy()

                const FINAL_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )
                const FINAL_ETH_BALANCE = await publicClient.getBalance({
                    address: smartAccountClient.account.address
                })

                expect(FINAL_TOKEN_BALANCE).toBeLessThan(INITIAL_TOKEN_BALANCE) // Token balance should be deducted
                expect(FINAL_ETH_BALANCE).toEqual(INTIAL_ETH_BALANCE) // There should be no ETH balance change
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "prepareUserOperationForErc20Paymaster_v07 (balanceOverride enabled)",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = privateKeyToAccount(privateKey)

                const account = (
                    await getSmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        privateKey,
                        ...rpc
                    })
                ).account

                const publicClient = getPublicClient(anvilRpc)

                const pimlicoClient = createPimlicoClient({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: entryPoint07Address,
                        version: "0.7"
                    }
                })

                const smartAccountClient = createSmartAccountClient({
                    // @ts-ignore
                    client: getPublicClient(anvilRpc),
                    account,
                    paymaster: pimlicoClient,
                    chain: foundry,
                    userOperation: {
                        prepareUserOperation:
                            prepareUserOperationForErc20Paymaster(
                                pimlicoClient,
                                {
                                    balanceOverride: true
                                }
                            )
                    },
                    bundlerTransport: http(rpc.altoRpc)
                })

                const INITIAL_TOKEN_BALANCE = parseEther("100")
                const INTIAL_ETH_BALANCE = await publicClient.getBalance({
                    address: smartAccountClient.account.address
                })

                sudoMintTokens({
                    amount: INITIAL_TOKEN_BALANCE,
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const authorization = isEip7702Compliant
                    ? await privateKeyAccount.signAuthorization({
                          address: (smartAccountClient.account as any)
                              .implementation,
                          chainId: smartAccountClient.chain.id,
                          nonce: await publicClient.getTransactionCount({
                              address: smartAccountClient.account.address
                          })
                      })
                    : undefined

                const opHash = await smartAccountClient.sendUserOperation({
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ],
                    paymasterContext: {
                        token: erc20Address
                    },
                    authorization
                })

                const receipt =
                    await smartAccountClient.waitForUserOperationReceipt({
                        hash: opHash
                    })

                expect(receipt).toBeTruthy()
                expect(receipt).toBeTruthy()
                expect(receipt.success).toBeTruthy()

                const FINAL_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )
                const FINAL_ETH_BALANCE = await publicClient.getBalance({
                    address: smartAccountClient.account.address
                })

                expect(FINAL_TOKEN_BALANCE).toBeLessThan(INITIAL_TOKEN_BALANCE) // Token balance should be deducted
                expect(FINAL_ETH_BALANCE).toEqual(INTIAL_ETH_BALANCE) // There should be no ETH balance change
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV08)(
            "prepareUserOperationForErc20Paymaster_v08 (balanceOverride enabled)",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = privateKeyToAccount(privateKey)

                const account = (
                    await getSmartAccountClient({
                        entryPoint: {
                            version: "0.8"
                        },
                        privateKey,
                        ...rpc
                    })
                ).account

                const publicClient = getPublicClient(anvilRpc)

                const pimlicoClient = createPimlicoClient({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: entryPoint08Address,
                        version: "0.8"
                    }
                })

                const smartAccountClient = createSmartAccountClient({
                    // @ts-ignore
                    client: getPublicClient(anvilRpc),
                    account,
                    paymaster: pimlicoClient,
                    chain: foundry,
                    userOperation: {
                        prepareUserOperation:
                            prepareUserOperationForErc20Paymaster(
                                pimlicoClient,
                                {
                                    balanceOverride: true
                                }
                            )
                    },
                    bundlerTransport: http(rpc.altoRpc)
                })

                const INITIAL_TOKEN_BALANCE = parseEther("100")
                const INTIAL_ETH_BALANCE = await publicClient.getBalance({
                    address: smartAccountClient.account.address
                })

                sudoMintTokens({
                    amount: INITIAL_TOKEN_BALANCE,
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const authorization = isEip7702Compliant
                    ? await privateKeyAccount.signAuthorization({
                          address: (smartAccountClient.account as any)
                              .implementation,
                          chainId: smartAccountClient.chain.id,
                          nonce: await publicClient.getTransactionCount({
                              address: smartAccountClient.account.address
                          })
                      })
                    : undefined

                const opHash = await smartAccountClient.sendUserOperation({
                    calls: [
                        {
                            to: zeroAddress,
                            data: "0x",
                            value: 0n
                        }
                    ],
                    paymasterContext: {
                        token: erc20Address
                    },
                    authorization
                })

                const receipt =
                    await smartAccountClient.waitForUserOperationReceipt({
                        hash: opHash
                    })

                expect(receipt).toBeTruthy()
                expect(receipt).toBeTruthy()
                expect(receipt.success).toBeTruthy()

                const FINAL_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )
                const FINAL_ETH_BALANCE = await publicClient.getBalance({
                    address: smartAccountClient.account.address
                })

                expect(FINAL_TOKEN_BALANCE).toBeLessThan(INITIAL_TOKEN_BALANCE) // Token balance should be deducted
                expect(FINAL_ETH_BALANCE).toEqual(INTIAL_ETH_BALANCE) // There should be no ETH balance change
            }
        )
    }
)
