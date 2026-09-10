import { Account, http } from "viem"
import { anvil } from "viem/chains"
import { EntryPoint } from "viem/erc4337"
import { Address, Secp256k1, Value } from "viem/utils"
import { describe, expect } from "vitest"
import {
    erc20Address,
    sudoMintTokens,
    tokenBalanceOf
} from "../../../mock-paymaster/helpers/erc20-utils"
import {
    createAutoBundleTransport,
    testWithRpc
} from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import * as PimlicoClient from "../../clients/pimlico/index.js"
import * as SmartAccountClient from "../../clients/smartAccount/index.js"
import { prepareUserOperation } from "./prepareUserOperation"

describe.each(getCoreSmartAccounts())(
    "Erc20Paymaster.prepareUserOperation $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07,
        supportsEntryPointV08,
        isEip7702Compliant,
        name
    }) => {
        const privateKey = Secp256k1.randomPrivateKey()
        testWithRpc.skipIf(!supportsEntryPointV06 || name === "Kernel 0.2.1")(
            "prepareUserOperation_v06",
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

                const pimlicoClient = PimlicoClient.create({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: EntryPoint.addressV06,
                        version: "0.6"
                    }
                })

                const publicClient = getPublicClient(anvilRpc)

                const smartAccountClient = SmartAccountClient.create({
                    client: getPublicClient(anvilRpc),
                    account,
                    paymaster: pimlicoClient,
                    chain: anvil,
                    userOperation: {
                        prepareUserOperation:
                            prepareUserOperation(pimlicoClient)
                    },
                    bundlerTransport: createAutoBundleTransport(
                        rpc.altoRpc,
                        rpc.anvilRpc
                    )
                })

                const INTIAL_ETH_BALANCE =
                    await publicClient.address.getBalance({
                        address: smartAccountClient.account.address
                    })

                const PRE_MINT_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )

                await sudoMintTokens({
                    amount: Value.fromEther("100"),
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const INITIAL_TOKEN_BALANCE =
                    PRE_MINT_TOKEN_BALANCE + Value.fromEther("100")

                const opHash = await smartAccountClient.userOperation.send({
                    calls: [
                        {
                            to: Address.zero,
                            data: "0x",
                            value: 0n
                        }
                    ],
                    paymasterContext: {
                        token: erc20Address
                    }
                })

                const receipt =
                    await smartAccountClient.userOperation.waitForReceipt({
                        hash: opHash
                    })

                expect(receipt).toBeTruthy()
                expect(receipt).toBeTruthy()

                expect(receipt.success).toBeTruthy()
                const FINAL_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )
                const FINAL_ETH_BALANCE = await publicClient.address.getBalance(
                    {
                        address: smartAccountClient.account.address
                    }
                )

                expect(FINAL_TOKEN_BALANCE).toBeLessThan(INITIAL_TOKEN_BALANCE) // Token balance should be deducted
                expect(FINAL_ETH_BALANCE).toEqual(INTIAL_ETH_BALANCE) // There should be no ETH balance change
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "prepareUserOperation_v07",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = Account.fromPrivateKey(privateKey)

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

                const pimlicoClient = PimlicoClient.create({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: EntryPoint.addressV07,
                        version: "0.7"
                    }
                })

                const smartAccountClient = SmartAccountClient.create({
                    client: getPublicClient(anvilRpc),
                    account,
                    paymaster: pimlicoClient,
                    chain: anvil,
                    userOperation: {
                        prepareUserOperation:
                            prepareUserOperation(pimlicoClient)
                    },
                    bundlerTransport: createAutoBundleTransport(
                        rpc.altoRpc,
                        rpc.anvilRpc
                    )
                })

                const INTIAL_ETH_BALANCE =
                    await publicClient.address.getBalance({
                        address: smartAccountClient.account.address
                    })

                const PRE_MINT_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )

                await sudoMintTokens({
                    amount: Value.fromEther("100"),
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const INITIAL_TOKEN_BALANCE =
                    PRE_MINT_TOKEN_BALANCE + Value.fromEther("100")

                const authorization = isEip7702Compliant
                    ? await privateKeyAccount.signAuthorization?.({
                          address: (smartAccountClient.account as any)
                              .authorization.address,
                          chainId: smartAccountClient.chain.id,
                          nonce: BigInt(
                              await publicClient.address.getTransactionCount({
                                  address: smartAccountClient.account.address
                              })
                          )
                      })
                    : undefined

                const opHash = await smartAccountClient.userOperation.send({
                    calls: [
                        {
                            to: Address.zero,
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
                    await smartAccountClient.userOperation.waitForReceipt({
                        hash: opHash
                    })

                expect(receipt).toBeTruthy()
                expect(receipt).toBeTruthy()
                expect(receipt.success).toBeTruthy()

                const FINAL_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )
                const FINAL_ETH_BALANCE = await publicClient.address.getBalance(
                    {
                        address: smartAccountClient.account.address
                    }
                )

                expect(FINAL_TOKEN_BALANCE).toBeLessThan(INITIAL_TOKEN_BALANCE) // Token balance should be deducted
                expect(FINAL_ETH_BALANCE).toEqual(INTIAL_ETH_BALANCE) // There should be no ETH balance change
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV08)(
            "prepareUserOperation_v08",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = Account.fromPrivateKey(privateKey)

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

                const pimlicoClient = PimlicoClient.create({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: EntryPoint.addressV08,
                        version: "0.8"
                    }
                })

                const smartAccountClient = SmartAccountClient.create({
                    client: getPublicClient(anvilRpc),
                    account,
                    paymaster: pimlicoClient,
                    chain: anvil,
                    userOperation: {
                        prepareUserOperation:
                            prepareUserOperation(pimlicoClient)
                    },
                    bundlerTransport: createAutoBundleTransport(
                        rpc.altoRpc,
                        rpc.anvilRpc
                    )
                })

                const INTIAL_ETH_BALANCE =
                    await publicClient.address.getBalance({
                        address: smartAccountClient.account.address
                    })

                const PRE_MINT_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )

                await sudoMintTokens({
                    amount: Value.fromEther("100"),
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const INITIAL_TOKEN_BALANCE =
                    PRE_MINT_TOKEN_BALANCE + Value.fromEther("100")

                const authorization = isEip7702Compliant
                    ? await privateKeyAccount.signAuthorization?.({
                          address: (smartAccountClient.account as any)
                              .authorization.address,
                          chainId: smartAccountClient.chain.id,
                          nonce: BigInt(
                              await publicClient.address.getTransactionCount({
                                  address: smartAccountClient.account.address
                              })
                          )
                      })
                    : undefined

                const opHash = await smartAccountClient.userOperation.send({
                    calls: [
                        {
                            to: Address.zero,
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
                    await smartAccountClient.userOperation.waitForReceipt({
                        hash: opHash
                    })

                expect(receipt).toBeTruthy()
                expect(receipt).toBeTruthy()
                expect(receipt.success).toBeTruthy()

                const FINAL_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )
                const FINAL_ETH_BALANCE = await publicClient.address.getBalance(
                    {
                        address: smartAccountClient.account.address
                    }
                )

                expect(FINAL_TOKEN_BALANCE).toBeLessThan(INITIAL_TOKEN_BALANCE) // Token balance should be deducted
                expect(FINAL_ETH_BALANCE).toEqual(INTIAL_ETH_BALANCE) // There should be no ETH balance change
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "prepareUserOperation_v07 (balanceOverride enabled)",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = Account.fromPrivateKey(privateKey)

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

                const pimlicoClient = PimlicoClient.create({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: EntryPoint.addressV07,
                        version: "0.7"
                    }
                })

                const smartAccountClient = SmartAccountClient.create({
                    client: getPublicClient(anvilRpc),
                    account,
                    paymaster: pimlicoClient,
                    chain: anvil,
                    userOperation: {
                        prepareUserOperation: prepareUserOperation(
                            pimlicoClient,
                            {
                                balanceOverride: true
                            }
                        )
                    },
                    bundlerTransport: createAutoBundleTransport(
                        rpc.altoRpc,
                        rpc.anvilRpc
                    )
                })

                const INTIAL_ETH_BALANCE =
                    await publicClient.address.getBalance({
                        address: smartAccountClient.account.address
                    })

                const PRE_MINT_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )

                await sudoMintTokens({
                    amount: Value.fromEther("100"),
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const INITIAL_TOKEN_BALANCE =
                    PRE_MINT_TOKEN_BALANCE + Value.fromEther("100")

                const authorization = isEip7702Compliant
                    ? await privateKeyAccount.signAuthorization?.({
                          address: (smartAccountClient.account as any)
                              .authorization.address,
                          chainId: smartAccountClient.chain.id,
                          nonce: BigInt(
                              await publicClient.address.getTransactionCount({
                                  address: smartAccountClient.account.address
                              })
                          )
                      })
                    : undefined

                const opHash = await smartAccountClient.userOperation.send({
                    calls: [
                        {
                            to: Address.zero,
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
                    await smartAccountClient.userOperation.waitForReceipt({
                        hash: opHash
                    })

                expect(receipt).toBeTruthy()
                expect(receipt).toBeTruthy()
                expect(receipt.success).toBeTruthy()

                const FINAL_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )
                const FINAL_ETH_BALANCE = await publicClient.address.getBalance(
                    {
                        address: smartAccountClient.account.address
                    }
                )

                expect(FINAL_TOKEN_BALANCE).toBeLessThan(INITIAL_TOKEN_BALANCE) // Token balance should be deducted
                expect(FINAL_ETH_BALANCE).toEqual(INTIAL_ETH_BALANCE) // There should be no ETH balance change
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV08)(
            "prepareUserOperation_v08 (balanceOverride enabled)",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const privateKeyAccount = Account.fromPrivateKey(privateKey)

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

                const pimlicoClient = PimlicoClient.create({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: EntryPoint.addressV08,
                        version: "0.8"
                    }
                })

                const smartAccountClient = SmartAccountClient.create({
                    client: getPublicClient(anvilRpc),
                    account,
                    paymaster: pimlicoClient,
                    chain: anvil,
                    userOperation: {
                        prepareUserOperation: prepareUserOperation(
                            pimlicoClient,
                            {
                                balanceOverride: true
                            }
                        )
                    },
                    bundlerTransport: createAutoBundleTransport(
                        rpc.altoRpc,
                        rpc.anvilRpc
                    )
                })

                const INTIAL_ETH_BALANCE =
                    await publicClient.address.getBalance({
                        address: smartAccountClient.account.address
                    })

                const PRE_MINT_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )

                await sudoMintTokens({
                    amount: Value.fromEther("100"),
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const INITIAL_TOKEN_BALANCE =
                    PRE_MINT_TOKEN_BALANCE + Value.fromEther("100")

                const authorization = isEip7702Compliant
                    ? await privateKeyAccount.signAuthorization?.({
                          address: (smartAccountClient.account as any)
                              .authorization.address,
                          chainId: smartAccountClient.chain.id,
                          nonce: BigInt(
                              await publicClient.address.getTransactionCount({
                                  address: smartAccountClient.account.address
                              })
                          )
                      })
                    : undefined

                const opHash = await smartAccountClient.userOperation.send({
                    calls: [
                        {
                            to: Address.zero,
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
                    await smartAccountClient.userOperation.waitForReceipt({
                        hash: opHash
                    })

                expect(receipt).toBeTruthy()
                expect(receipt).toBeTruthy()
                expect(receipt.success).toBeTruthy()

                const FINAL_TOKEN_BALANCE = await tokenBalanceOf(
                    smartAccountClient.account.address,
                    rpc.anvilRpc
                )
                const FINAL_ETH_BALANCE = await publicClient.address.getBalance(
                    {
                        address: smartAccountClient.account.address
                    }
                )

                expect(FINAL_TOKEN_BALANCE).toBeLessThan(INITIAL_TOKEN_BALANCE) // Token balance should be deducted
                expect(FINAL_ETH_BALANCE).toEqual(INTIAL_ETH_BALANCE) // There should be no ETH balance change
            }
        )
    }
)
