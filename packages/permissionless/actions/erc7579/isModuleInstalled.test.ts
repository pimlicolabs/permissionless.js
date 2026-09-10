import { ContractError } from "viem"
import { AbiFunction, AbiParameters, Address } from "viem/utils"
import { describe, expect, test } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getCoreSmartAccounts } from "../../../permissionless-test/src/utils"
import { erc7579Actions } from "../../clients/decorators/erc7579"
import { isModuleInstalled } from "./isModuleInstalled"

describe.each(getCoreSmartAccounts())(
    "isModuleInstalled $name",
    ({ getErc7579SmartAccountClient, name }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "isModuleInstalled",
            async ({ rpc }) => {
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const smartClientWithoutExtend =
                    await getErc7579SmartAccountClient({
                        entryPoint: {
                            version: "0.7"
                        },
                        ...rpc
                    })

                const smartClient = smartClientWithoutExtend.extend(
                    erc7579Actions()
                )

                const moduleData = AbiParameters.encodePacked(
                    ["address"],
                    [smartClient.account.address]
                )

                const opHash = await smartClient.installModule({
                    account: smartClient.account as any,
                    type: "executor",
                    address: "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                    context: name.startsWith("Kernel 7579")
                        ? AbiParameters.encodePacked(
                              ["address", "bytes"],
                              [
                                  Address.zero,
                                  AbiParameters.encode(
                                      [{ type: "bytes" }, { type: "bytes" }],
                                      [moduleData, "0x"]
                                  )
                              ]
                          )
                        : moduleData
                })

                await smartClient.userOperation.waitForReceipt({
                    hash: opHash,
                    timeout: 100000
                })

                const isModuleInstalledResult = await isModuleInstalled(
                    smartClient,
                    {
                        account: smartClient.account,
                        type: "executor",
                        address: "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                        context: "0x"
                    }
                )

                expect(isModuleInstalledResult).toBe(true)
            }
        )
    }
)

describe("isModuleInstalled on an undeployed account", () => {
    const module = "0x4Fd8d57b94966982B62e9588C27B4171B55E8354"
    const abi = AbiFunction.from(
        "function isModuleInstalled(uint256, address, bytes) view returns (bool)"
    )

    const account = (publicClient: unknown) =>
        ({
            address: "0x0000000000000000000000000000000000000001",
            client: publicClient,
            getFactoryArgs: async () => ({
                factory: "0x0000000000000000000000000000000000000002",
                factoryData: "0xf00d"
            })
        }) as never

    const reverts = () => {
        throw new ContractError.ContractFunctionExecutionError(
            new ContractError.ContractFunctionRevertedError({
                abi: [abi],
                functionName: "isModuleInstalled"
            }),
            { abi: [abi], functionName: "isModuleInstalled" }
        )
    }

    test("falls back to a counterfactual eth_call with the factory args", async () => {
        const calls: unknown[] = []
        const client = {
            request: () => {},
            contract: { read: reverts },
            call: async (parameters: unknown) => {
                calls.push(parameters)
                return { data: AbiFunction.encodeResult(abi, true) }
            }
        }

        expect(
            await isModuleInstalled({ account: account(client) } as never, {
                type: "executor",
                address: module.toLowerCase() as never,
                context: "0x"
            })
        ).toBe(true)
        expect(calls[0]).toEqual({
            factory: "0x0000000000000000000000000000000000000002",
            factoryData: "0xf00d",
            to: "0x0000000000000000000000000000000000000001",
            // the module address is checksummed before it is encoded
            data: AbiFunction.encodeData(abi, [2n, module, "0x"])
        })
    })

    test("throws ContractFunctionZeroDataError when the counterfactual call returns nothing", async () => {
        const client = {
            request: () => {},
            contract: { read: reverts },
            call: async () => ({})
        }

        await expect(
            isModuleInstalled({ account: account(client) } as never, {
                type: "executor",
                address: module,
                context: "0x"
            })
        ).rejects.toThrow(ContractError.ContractFunctionZeroDataError)
    })

    test("rethrows anything that is not a contract execution error", async () => {
        const client = {
            request: () => {},
            contract: {
                read: () => {
                    throw new Error("transport down")
                }
            }
        }

        await expect(
            isModuleInstalled({ account: account(client) } as never, {
                type: "executor",
                address: module,
                context: "0x"
            })
        ).rejects.toThrow("transport down")
    })
})
