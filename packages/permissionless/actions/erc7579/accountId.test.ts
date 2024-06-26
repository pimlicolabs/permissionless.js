import {
    http,
    encodeAbiParameters,
    encodePacked,
    getAddress,
    isHash,
    zeroAddress
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import {
    signerToEcdsaKernelSmartAccount,
    signerToSafeSmartAccount
} from "../../accounts"
import { createSmartAccountClient } from "../../clients/createSmartAccountClient"
import { erc7579Actions } from "../../clients/decorators/erc7579"
import { createBundlerClient } from "../../index"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { accountId } from "./accountId"

describe.each(getCoreSmartAccounts())(
    "accountId $name",
    ({ getErc7579SmartAccountClient }) => {
        // testWithRpc.skipIf(!getErc7579SmartAccountClient)(
        //     "accountId",
        //     async ({ rpc }) => {
        //         const { anvilRpc, altoRpc, paymasterRpc } = rpc

        //         if (!getErc7579SmartAccountClient) {
        //             throw new Error("getErc7579SmartAccountClient not defined")
        //         }

        //         const smartClient = await getErc7579SmartAccountClient({
        //             entryPoint: ENTRYPOINT_ADDRESS_V07,
        //             privateKey: generatePrivateKey(),
        //             altoRpc: altoRpc,
        //             anvilRpc: anvilRpc,
        //             paymasterClient: getPimlicoPaymasterClient({
        //                 entryPoint: ENTRYPOINT_ADDRESS_V07,
        //                 paymasterRpc
        //             })
        //         })

        //         const accountIdBeforeDeploy = await accountId(
        //             smartClient as any
        //         )

        //         // deploy account
        //         await smartClient.sendTransaction({
        //             to: zeroAddress,
        //             value: 0n,
        //             data: "0x"
        //         })

        //         const postDeployAccountId = await accountId(smartClient as any)

        //         expect(accountIdBeforeDeploy).toBe(postDeployAccountId)
        //     }
        // )

        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "accountId",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }
                const publicClient = getPublicClient(anvilRpc)
                const signer = privateKeyToAccount(
                    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
                )
                // const kernelSmartAccount =
                //     await signerToEcdsaKernelSmartAccount(publicClient, {
                //         entryPoint: ENTRYPOINT_ADDRESS_V07,
                //         signer: signer,
                //         version: "0.3.0"
                //     })

                const safeSmartAccount = await signerToSafeSmartAccount(
                    publicClient,
                    {
                        entryPoint: ENTRYPOINT_ADDRESS_V07,
                        signer: signer,
                        safeVersion: "1.4.1",
                        saltNonce: 420n,
                        safe4337ModuleAddress: getAddress(
                            "0x50Da3861d482116c5F2Ea6d673a58CedB786Dc1C"
                        ),
                        erc7579: true
                    }
                )

                const paymasterClient = getPimlicoPaymasterClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    paymasterRpc: paymasterRpc
                })
                const smartClient = createSmartAccountClient({
                    chain: foundry,
                    account: safeSmartAccount,
                    bundlerTransport: http(altoRpc),
                    middleware: {
                        sponsorUserOperation:
                            paymasterClient.sponsorUserOperation
                    }
                }).extend(
                    erc7579Actions({ entryPoint: ENTRYPOINT_ADDRESS_V07 })
                )

                const moduleData = encodePacked(
                    ["address"],
                    [smartClient.account.address]
                )

                const accountIdBeforeDeploy = await smartClient.accountId()

                const opHashInstallModule = await smartClient.installModule({
                    type: "execution",
                    address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                    callData: encodePacked(
                        ["address", "bytes"],
                        [
                            zeroAddress,
                            encodeAbiParameters(
                                [{ type: "bytes" }, { type: "bytes" }],
                                [moduleData, "0x"]
                            )
                        ]
                    )
                })

                const bundlerClientV07 = createBundlerClient({
                    transport: http(altoRpc),
                    entryPoint: ENTRYPOINT_ADDRESS_V07
                })

                expect(isHash(opHashInstallModule)).toBe(true)

                const userOperationReceiptInstallModule =
                    await bundlerClientV07.waitForUserOperationReceipt({
                        hash: opHashInstallModule,
                        timeout: 100000
                    })
                expect(userOperationReceiptInstallModule).not.toBeNull()
                expect(userOperationReceiptInstallModule?.userOpHash).toBe(
                    opHashInstallModule
                )
                expect(
                    userOperationReceiptInstallModule?.receipt.transactionHash
                ).toBeTruthy()

                const accountIdAfterDeploy = await smartClient.accountId()

                expect(accountIdBeforeDeploy).toBe(accountIdAfterDeploy)

                const opHashIsModuleInstalled =
                    await smartClient.isModuleInstalled({
                        type: "execution",
                        address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                        callData: "0x"
                    })

                expect(opHashIsModuleInstalled).toBe(true)

                const supportsExecutionMode =
                    await smartClient.supportsExecutionMode({
                        callType: "batchcall",
                        revertOnError: false,
                        modeSelector: "0x0",
                        modeData: "0x"
                    })

                expect(supportsExecutionMode).toBe(true)

                const supportsModule = await smartClient.supportsModule({
                    type: "execution"
                })

                expect(supportsModule).toBe(true)

                const opHashUninstallModule = await smartClient.uninstallModule(
                    {
                        type: "execution",
                        address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                        callData: "0x"
                    }
                )

                expect(isHash(opHashUninstallModule)).toBe(true)

                const userOperationReceiptUninstallModule =
                    await bundlerClientV07.waitForUserOperationReceipt({
                        hash: opHashUninstallModule,
                        timeout: 100000
                    })
                expect(userOperationReceiptUninstallModule).not.toBeNull()
                expect(userOperationReceiptUninstallModule?.userOpHash).toBe(
                    opHashUninstallModule
                )
                expect(
                    userOperationReceiptUninstallModule?.receipt.transactionHash
                ).toBeTruthy()

                expect(
                    await smartClient.isModuleInstalled({
                        type: "execution",
                        address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
                        callData: "0x"
                    })
                ).toBe(false)
            }
        )
    }
)
