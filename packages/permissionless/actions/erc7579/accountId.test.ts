import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { accountId } from "./accountId"
import { getAddress, http, zeroAddress } from "viem"
import { erc7579Actions } from "../../clients/decorators/erc7579"
import { signerToSafeSmartAccount } from "../../accounts"
import { createSmartAccountClient } from "../../clients/createSmartAccountClient"
import { foundry } from "viem/chains"

describe.each(getCoreSmartAccounts())(
    "accountId $name",
    ({ getErc7579SmartAccountClient, supportsErc7579 }) => {
        testWithRpc.skipIf(!supportsErc7579)("accountId", async ({ rpc }) => {
            const { anvilRpc, altoRpc, paymasterRpc } = rpc

            if (!getErc7579SmartAccountClient) {
                throw new Error("getErc7579SmartAccountClient not defined")
            }
            const publicClient = getPublicClient(
                "https://sepolia.rpc.thirdweb.com/9fc39d5e2a3e149cc31cf9625806a2fe"
            )

            const signer = privateKeyToAccount(generatePrivateKey())

            const safeSmartAccount = await signerToSafeSmartAccount(
                publicClient,
                {
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    signer: signer,
                    safeVersion: "1.4.1",
                    saltNonce: 420n,
                    safe4337ModuleAddress: getAddress(
                        "0xbaCA6f74a5549368568f387FD989C279f940f1A5"
                    ),
                    erc7579: true
                }
            )

            console.log({ signer: signer.address })

            const paymasterClient = getPimlicoPaymasterClient({
                entryPoint: ENTRYPOINT_ADDRESS_V07,
                paymasterRpc:
                    "https://api.pimlico.io/v2/sepolia/rpc?apikey=2a34d830-b4d4-47ad-80e8-b53278b1439a"
            })

            const smartClient = createSmartAccountClient({
                chain: foundry,
                account: safeSmartAccount,
                bundlerTransport: http("http://0.0.0.0:3000"),
                middleware: {
                    sponsorUserOperation: paymasterClient.sponsorUserOperation
                }
            }).extend(erc7579Actions({ entryPoint: ENTRYPOINT_ADDRESS_V07 }))

            smartClient.accountId()

            const accountIdBeforeDeploy = await accountId(smartClient as any)

            console.log({ accountIdBeforeDeploy })

            // deploy account
            await smartClient.sendTransaction({
                to: zeroAddress,
                value: 0n,
                data: "0x"
            })

            // const result = await publicClient.readContract({
            //     abi: [
            //         {
            //             name: "isModuleEnabled",
            //             type: "function",
            //             stateMutability: "view",
            //             inputs: [
            //                 {
            //                     type: "address",
            //                     name: "module"
            //                 }
            //             ],
            //             outputs: [
            //                 {
            //                     type: "bool"
            //                 }
            //             ]
            //         }
            //     ],
            //     functionName: "isModuleEnabled",
            //     args: [
            //         getAddress("0xbaCA6f74a5549368568f387FD989C279f940f1A5")
            //     ],
            //     address: smartClient.account.address
            // })

            // const postDeployAccountId = await accountId(smartClient as any)

            // console.log({ result })

            // expect(accountIdBeforeDeploy).toBe(postDeployAccountId)
        })
    }
)
