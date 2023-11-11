import { beforeAll, describe, expect, test } from "bun:test"
import dotenv from "dotenv"
import { SignTransactionNotSupportedBySmartAccount } from "permissionless/accounts"
import { SponsorUserOperationParameters, SponsorUserOperationReturnType } from "permissionless/actions/smartAccount.js"
import { Address, Client, getContract, zeroAddress } from "viem"
import { GreeterAbi, GreeterBytecode } from "./abis/Greeter.js"
import {
    getEntryPoint,
    getPimlicoPaymasterClient,
    getPrivateKeyToSimpleSmartAccount,
    getPublicClient,
    getSmartAccountClient,
    getTestingChain
} from "./utils.js"

dotenv.config()

beforeAll(() => {
    if (!process.env.PIMLICO_API_KEY) {
        throw new Error("PIMLICO_API_KEY environment variable not set")
    }
    if (!process.env.STACKUP_API_KEY) {
        throw new Error("STACKUP_API_KEY environment variable not set")
    }
    if (!process.env.FACTORY_ADDRESS) {
        throw new Error("FACTORY_ADDRESS environment variable not set")
    }
    if (!process.env.RPC_URL) {
        throw new Error("RPC_URL environment variable not set")
    }
    if (!process.env.ENTRYPOINT_ADDRESS) {
        throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
    }

    if (!process.env.GREETER_ADDRESS) {
        throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
    }
})

describe("Simple Account", () => {
    test("Simple Account address", async () => {
        const simpleSmartAccount = await getPrivateKeyToSimpleSmartAccount()

        expect(simpleSmartAccount.address).toBeString()
        expect(simpleSmartAccount.address).toHaveLength(42)
        expect(simpleSmartAccount.address).toMatch(/^0x[0-9a-fA-F]{40}$/)

        expect(async () => {
            await simpleSmartAccount.signTransaction({
                to: zeroAddress,
                value: 0n,
                data: "0x"
            })
        }).toThrow(new SignTransactionNotSupportedBySmartAccount())
    })

    test("Smart account client chain id", async () => {
        const smartAccountClient = await getSmartAccountClient()

        const chain = getTestingChain()

        const chainId = await smartAccountClient.getChainId()

        expect(chainId).toBeNumber()
        expect(chainId).toBeGreaterThan(0)

        expect(chainId).toEqual(chain.id)
    })

    test("Smart account client signMessage", async () => {
        const smartAccountClient = await getSmartAccountClient()

        const response = await smartAccountClient.signMessage({
            message: "hello world"
        })

        expect(response).toBeString()
        expect(response).toHaveLength(132)
        expect(response).toMatch(/^0x[0-9a-fA-F]{130}$/)
    })

    test("Smart account client signTypedData", async () => {
        const smartAccountClient = await getSmartAccountClient()

        const response = await smartAccountClient.signTypedData({
            domain: {
                chainId: 1,
                name: "Test",
                verifyingContract: zeroAddress
            },
            primaryType: "Test",
            types: {
                Test: [
                    {
                        name: "test",
                        type: "string"
                    }
                ]
            },
            message: {
                test: "hello world"
            }
        })

        expect(response).toBeString()
        expect(response).toHaveLength(132)
        expect(response).toMatch(/^0x[0-9a-fA-F]{130}$/)
    })

    test("smart account client deploy contract", async () => {
        const smartAccountClient = await getSmartAccountClient()

        expect(async () => {
            await smartAccountClient.deployContract({
                abi: GreeterAbi,
                bytecode: GreeterBytecode
            })
        }).toThrow("Simple account doesn't support account deployment")
    })

    test("smart account client send Transaction with paymaster", async () => {
        const smartAccountClient = await getSmartAccountClient()

        const smartAccountClientNew = smartAccountClient.extend((_: Client) => ({
            sponsorUserOperation: async (
                args: SponsorUserOperationParameters
            ): Promise<SponsorUserOperationReturnType> => {
                const pimlicoPaymaster = getPimlicoPaymasterClient()
                const { userOperation } = args
                return pimlicoPaymaster.sponsorUserOperation({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
            }
        }))

        const response = await smartAccountClientNew.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })

        expect(response).toBeString()
        expect(response).toHaveLength(66)
        expect(response).toMatch(/^0x[0-9a-fA-F]{64}$/)
    }, 1000000)

    test("Smart account write contract", async () => {
        const greeterContract = getContract({
            abi: GreeterAbi,
            address: process.env.GREETER_ADDRESS as Address,
            publicClient: await getPublicClient(),
            walletClient: await getSmartAccountClient()
        })

        const oldGreet = await greeterContract.read.greet()

        expect(oldGreet).toBeString()

        const txHash = await greeterContract.write.setGreeting(["hello world"])

        const newGreet = await greeterContract.read.greet()

        expect(newGreet).toBeString()
        expect(newGreet).toEqual("hello world")
    }, 1000000)

    test("Smart account client send transaction", async () => {
        const smartAccountClient = await getSmartAccountClient()
        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x"
        })
        expect(response).toBeString()
        expect(response).toHaveLength(66)
        expect(response).toMatch(/^0x[0-9a-fA-F]{64}$/)
    }, 1000000)
})
