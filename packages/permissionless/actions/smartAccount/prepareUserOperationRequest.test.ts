import { zeroAddress } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getPimlicoPaymasterClient
} from "../../../permissionless-test/src/utils"
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "../../utils"

describe.each(getCoreSmartAccounts())(
    "prepareUserOperationRequest $name",
    ({
        getSmartAccountClient,
        supportsEntryPointV06,
        supportsEntryPointV07
    }) => {
        testWithRpc.skipIf(!supportsEntryPointV06)(
            "prepareUserOperationRequest_v06",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V06,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc
                })

                const userOperation =
                    await smartClient.prepareUserOperationRequest({
                        userOperation: {
                            callData: await smartClient.account.encodeCallData({
                                to: zeroAddress,
                                data: "0x",
                                value: 0n
                            })
                        }
                    })
                expect(userOperation).toBeTruthy()
                expect(userOperation.sender).toBe(smartClient.account.address)
                expect(userOperation.nonce).toBe(
                    await smartClient.account.getNonce()
                )
                expect(userOperation.initCode).toBe(
                    await smartClient.account.getInitCode()
                )
                expect(userOperation.callData).toBe(
                    await smartClient.account.encodeCallData({
                        to: zeroAddress,
                        data: "0x",
                        value: 0n
                    })
                )
                expect(userOperation.callGasLimit).toBeTruthy()
                expect(userOperation.verificationGasLimit).toBeTruthy()
                expect(userOperation.maxFeePerGas).toBeTruthy()
                expect(userOperation.maxPriorityFeePerGas).toBeTruthy()
                expect(userOperation.paymasterAndData).toBe("0x")
                expect(userOperation.signature).toBe(
                    await smartClient.account.getDummySignature(userOperation)
                )

                expect(userOperation.factory).toBe(undefined)
                expect(userOperation.factoryData).toBe(undefined)
                expect(userOperation.paymaster).toBe(undefined)
                expect(userOperation.paymasterVerificationGasLimit).toBe(
                    undefined
                )
                expect(userOperation.paymasterPostOpGasLimit).toBe(undefined)
                expect(userOperation.paymasterData).toBe(undefined)
            }
        )

        testWithRpc.skipIf(!supportsEntryPointV07)(
            "prepareUserOperationRequest_v07",
            async ({ rpc }) => {
                const { anvilRpc, altoRpc } = rpc

                const smartClient = await getSmartAccountClient({
                    entryPoint: ENTRYPOINT_ADDRESS_V07,
                    privateKey: generatePrivateKey(),
                    altoRpc: altoRpc,
                    anvilRpc: anvilRpc
                })

                const userOperation =
                    await smartClient.prepareUserOperationRequest({
                        userOperation: {
                            callData: await smartClient.account.encodeCallData({
                                to: zeroAddress,
                                data: "0x",
                                value: 0n
                            })
                        }
                    })

                expect(userOperation).toBeTruthy()
                expect(userOperation.sender).toBe(smartClient.account.address)
                expect(userOperation.nonce).toBe(
                    await smartClient.account.getNonce()
                )
                expect(userOperation.factory).toBe(
                    await smartClient.account.getFactory()
                )
                expect(userOperation.factoryData).toBe(
                    await smartClient.account.getFactoryData()
                )
                expect(userOperation.callData).toBe(
                    await smartClient.account.encodeCallData({
                        to: zeroAddress,
                        data: "0x",
                        value: 0n
                    })
                )
                expect(userOperation.callGasLimit).toBeTruthy()
                expect(userOperation.verificationGasLimit).toBeTruthy()
                expect(userOperation.maxFeePerGas).toBeTruthy()
                expect(userOperation.maxPriorityFeePerGas).toBeTruthy()
                expect(userOperation.paymaster).toBe(undefined)
                expect(userOperation.paymasterVerificationGasLimit).toBe(
                    undefined
                )
                expect(userOperation.signature).toBe(
                    // @ts-ignore: since tests return all smart account client, some of them don't support V07.
                    // The TS error is because in that case, getDummySignature would not accept the userOperation of type UserOperation<V07>
                    await smartClient.account.getDummySignature(userOperation)
                )
                expect(userOperation.paymasterPostOpGasLimit).toBe(0n)
                expect(userOperation.paymasterData).toBe(undefined)
                expect(userOperation.paymasterAndData).toBe(undefined)
                expect(userOperation.initCode).toBe(undefined)
            }
        )
    }
)
