import type { Chain, Client, Transport } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { foundry } from "viem/chains"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient
} from "../../../permissionless-test/src/utils"
import type { SmartAccount } from "../../accounts"
import type { SmartAccountClient } from "../../clients/createSmartAccountClient"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    EntryPoint
} from "../../types/entrypoint"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"
import { deployContract } from "./deployContract"

describe.each(getCoreSmartAccounts())(
    "deployContract $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07
    }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "deployContract_V06",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V06,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V06,
                        paymasterRpc
                    })
                })

                await expect(async () =>
                    deployContract(
                        smartClient as Client<
                            Transport,
                            Chain,
                            SmartAccount<EntryPoint>
                        >,
                        {
                            account: smartClient.account,
                            chain: foundry,
                            abi: [
                                {
                                    inputs: [],
                                    stateMutability: "payable",
                                    type: "constructor"
                                }
                            ],
                            bytecode:
                                "0x608060405260358060116000396000f3006080604052600080fd00a165627a7a72305820f86ff341f0dff29df244305f8aa88abaf10e3a0719fa6ea1dcdd01b8b7d750970029"
                        }
                    )
                ).rejects.toThrowError(
                    /^.*doesn't support account deployment.*$/i
                )
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "deployContract_V07",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc, paymasterRpc } = rpc

                const smartClient = (await getSmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc,
                    paymasterClient: getPimlicoPaymasterClient({
                        entryPoint: ENTRYPOINT_ADDRESS_V07,
                        paymasterRpc
                    })
                })) as SmartAccountClient<
                    ENTRYPOINT_ADDRESS_V07_TYPE,
                    Transport,
                    Chain,
                    SmartAccount<ENTRYPOINT_ADDRESS_V07_TYPE>
                >

                await expect(async () =>
                    deployContract(
                        smartClient as Client<
                            Transport,
                            Chain,
                            SmartAccount<EntryPoint>
                        >,
                        {
                            account: smartClient.account,
                            chain: foundry,
                            abi: [
                                {
                                    inputs: [],
                                    stateMutability: "payable",
                                    type: "constructor"
                                }
                            ],
                            bytecode:
                                "0x608060405260358060116000396000f3006080604052600080fd00a165627a7a72305820f86ff341f0dff29df244305f8aa88abaf10e3a0719fa6ea1dcdd01b8b7d750970029"
                        }
                    )
                ).rejects.toThrowError(
                    /^.*doesn't support account deployment.*$/i
                )
            }
        )
    }
)
