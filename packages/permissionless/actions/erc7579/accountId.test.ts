import {
    http,
    createPublicClient,
    encodeAbiParameters,
    encodePacked,
    getAddress,
    isHash,
    zeroAddress
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { foundry, sepolia } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoBundlerClient,
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
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "accountId",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const smartClient = await getErc7579SmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V07,
                        paymasterRpc
                    })
                })

                const accountIdBeforeDeploy = await accountId(
                    smartClient as any
                )

                // deploy account
                await smartClient.sendTransaction({
                    to: zeroAddress,
                    value: 0n,
                    data: "0x"
                })

                const postDeployAccountId = await accountId(smartClient as any)

                expect(accountIdBeforeDeploy).toBe(postDeployAccountId)
            }
        )
    }

    //     testWithRpc.skipIf(!getErc7579SmartAccountClient)(
    //         "accountId",
    //         async ({ rpc }) => {
    //             const { anvilRpc, altoRpc, paymasterRpc } = rpc

    //             // const anvilRpc =
    //             //     "https://sepolia.rpc.thirdweb.com/9fc39d5e2a3e149cc31cf9625806a2fe"
    //             // const altoRpc =
    //             //     "https://api.pimlico.io/v2/sepolia/rpc?apikey=2a34d830-b4d4-47ad-80e8-b53278b1439a"
    //             // const paymasterRpc =
    //             //     "https://api.pimlico.io/v2/sepolia/rpc?apikey=2a34d830-b4d4-47ad-80e8-b53278b1439a"

    //             if (!getErc7579SmartAccountClient) {
    //                 throw new Error("getErc7579SmartAccountClient not defined")
    //             }
    //             const publicClient = createPublicClient({
    //                 transport: http(anvilRpc),
    //                 chain: foundry
    //                 // chain: sepolia
    //             })
    //             const signer = privateKeyToAccount(
    //                 generatePrivateKey()
    //                 // "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    //             )
    //             // const kernelSmartAccount =
    //             //     await signerToEcdsaKernelSmartAccount(publicClient, {
    //             //         entryPoint: ENTRYPOINT_ADDRESS_V07,
    //             //         signer: signer,
    //             //         version: "0.3.0"
    //             //     })

    //             const safeSmartAccount = await signerToSafeSmartAccount(
    //                 publicClient,
    //                 {
    //                     entryPoint: ENTRYPOINT_ADDRESS_V07,
    //                     signer: signer,
    //                     safeVersion: "1.4.1",
    //                     saltNonce: 120n,
    //                     safe4337ModuleAddress: getAddress(
    //                         "0x50Da3861d482116c5F2Ea6d673a58CedB786Dc1C"
    //                     ),
    //                     erc7579: true
    //                 }
    //             )

    //             const paymasterClient = getPimlicoPaymasterClient({
    //                 entryPoint: ENTRYPOINT_ADDRESS_V07,
    //                 paymasterRpc: paymasterRpc
    //             })

    //             const pimlicoClient = getPimlicoBundlerClient({
    //                 entryPoint: ENTRYPOINT_ADDRESS_V07,
    //                 altoRpc: altoRpc
    //             })

    //             const smartClient = createSmartAccountClient({
    //                 // chain: sepolia,
    //                 chain: foundry,
    //                 account: safeSmartAccount,
    //                 bundlerTransport: http(altoRpc),
    //                 middleware: {
    //                     gasPrice: async () =>
    //                         (await pimlicoClient.getUserOperationGasPrice())
    //                             .fast,
    //                     sponsorUserOperation:
    //                         paymasterClient.sponsorUserOperation
    //                 }
    //             }).extend(
    //                 erc7579Actions({ entryPoint: ENTRYPOINT_ADDRESS_V07 })
    //             )

    //             const moduleData = encodePacked(["address"], [signer.address])

    //             const opHashInstallModule = await smartClient.installModule({
    //                 type: "executor",
    //                 address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
    //                 context: moduleData
    //             })

    //             console.log("Sent user operation: ", opHashInstallModule)

    //             const bundlerClientV07 = createBundlerClient({
    //                 transport: http(altoRpc),
    //                 entryPoint: ENTRYPOINT_ADDRESS_V07
    //             })

    //             const transactionHash =
    //                 await bundlerClientV07.waitForUserOperationReceipt({
    //                     hash: opHashInstallModule,
    //                     timeout: 1000000
    //                 })

    //             console.log(
    //                 "transactionHash: ",
    //                 transactionHash.receipt.transactionHash
    //             )

    //             const isModuleInstalled = await smartClient.isModuleInstalled({
    //                 type: "executor",
    //                 address: "0xc98B026383885F41d9a995f85FC480E9bb8bB891",
    //                 context: "0x"
    //             })

    //             console.log("is module installed: ", isModuleInstalled)

    //             expect(isModuleInstalled).toBe(true)
    //         }
    //     )
    // }
)
