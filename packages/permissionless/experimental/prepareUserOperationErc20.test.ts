import { http, parseEther, zeroAddress } from "viem"
import { entryPoint07Address } from "viem/account-abstraction"
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
    ({ getAccount, supportsEntryPointV06, supportsEntryPointV07 }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "prepareUserOperationErc20_v06",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const account = await getAccount({
                    entryPoint: {
                        version: "0.6"
                    },
                    ...rpc
                })

                const paymaster = createPimlicoClient({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: entryPoint07Address,
                        version: "0.6"
                    }
                })

                const smartAccountClient = createSmartAccountClient({
                    // @ts-ignore
                    client: getPublicClient(anvilRpc),
                    chain: foundry,
                    account,
                    paymaster,
                    userOperation: {
                        prepareUserOperation: prepareUserOperationErc20
                    },
                    bundlerTransport: http(rpc.altoRpc)
                })

                const INITIAL_BALANCE = parseEther("100")

                await sudoMintTokens({
                    amount: INITIAL_BALANCE,
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const transactionHash =
                    await smartAccountClient.sendUserOperation({
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

                expect(transactionHash).toBeTruthy()

                const publicClient = getPublicClient(anvilRpc)

                const receipt = await publicClient.getTransactionReceipt({
                    hash: transactionHash
                })

                expect(
                    await tokenBalanceOf(
                        smartAccountClient.account.address,
                        rpc.anvilRpc
                    )
                ).toBeLessThan(INITIAL_BALANCE)
                expect(receipt).toBeTruthy()
                expect(receipt.transactionHash).toBe(transactionHash)
                expect(receipt.status).toBe("success")
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "prepareUserOperationErc20_v07",
            async ({ rpc }) => {
                const { anvilRpc } = rpc

                const account = await getAccount({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                const paymaster = createPimlicoClient({
                    transport: http(rpc.paymasterRpc),
                    entryPoint: {
                        address: entryPoint07Address,
                        version: "0.7"
                    }
                })

                const smartAccountClient = createSmartAccountClient({
                    // @ts-ignore
                    client: getPublicClient(anvilRpc),
                    chain: foundry,
                    account,
                    paymaster,
                    userOperation: {
                        prepareUserOperation: prepareUserOperationErc20
                    },
                    bundlerTransport: http(rpc.altoRpc)
                })

                await sudoMintTokens({
                    amount: parseEther("100"),
                    to: smartAccountClient.account.address,
                    anvilRpc
                })

                const transactionHash =
                    await smartAccountClient.sendTransaction({
                        to: zeroAddress,
                        data: "0x",
                        value: 0n
                    })

                expect(transactionHash).toBeTruthy()

                const publicClient = getPublicClient(anvilRpc)

                const receipt = await publicClient.getTransactionReceipt({
                    hash: transactionHash
                })

                expect(receipt).toBeTruthy()
                expect(receipt.transactionHash).toBe(transactionHash)
                expect(receipt.status).toBe("success")
            }
        )
    }
)
