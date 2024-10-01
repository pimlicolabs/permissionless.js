import { http, parseEther, zeroAddress } from "viem"
import {
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import {
    ERC20_ADDRESS,
    sudoMintTokens,
    tokenBalanceOf
} from "../../permissionless-test/src/erc20-utils.ts"
import { testWithRpc } from "../../permissionless-test/src/testWithRpc.ts"
import {
    getCoreSmartAccounts,
    getPublicClient
} from "../../permissionless-test/src/utils"
import { createSmartAccountClient } from "../clients/createSmartAccountClient.ts"
import { createPimlicoClient } from "../clients/pimlico.ts"
import { prepareUserOperationErc20 } from "./prepareUserOperationErc20.ts"

describe.each(getCoreSmartAccounts())(
    "prepareUserOperationErc20 $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07
    }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "prepareUserOperationErc20_v06",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const account = (
                    await getSmartAccountClient({
                        entryPoint: {
                            version: "0.6"
                        },
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
                    chain: foundry,
                    account,
                    paymaster: pimlicoClient,
                    userOperation: {
                        prepareUserOperation:
                            prepareUserOperationErc20(pimlicoClient)
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
                        token: ERC20_ADDRESS
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
            "prepareUserOperationErc20_v07",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const account = (
                    await getSmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        ...rpc
                    })
                ).account

                const pimlicoClient = createPimlicoClient({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: entryPoint07Address,
                        version: "0.7"
                    }
                })

                const publicClient = getPublicClient(anvilRpc)

                const smartAccountClient = createSmartAccountClient({
                    // @ts-ignore
                    client: getPublicClient(anvilRpc),
                    chain: foundry,
                    account,
                    paymaster: pimlicoClient,
                    userOperation: {
                        prepareUserOperation:
                            prepareUserOperationErc20(pimlicoClient)
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
                        token: ERC20_ADDRESS
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
    }
)
