import dotenv from "dotenv"
import { SignTransactionNotSupportedBySmartAccount } from "permissionless/accounts"
import { Address, Hex, zeroAddress } from "viem"
import { getPrivateKeyToSimpleSmartAccount, getPublicClient, getSmartAccountClient, getTestingChain } from "./utils"
import { beforeAll, describe, expect, test } from "bun:test"

dotenv.config()

let testPrivateKey: Hex
let factoryAddress: Address

beforeAll(() => {
    if (!process.env.PIMLICO_API_KEY) throw new Error("PIMLICO_API_KEY environment variable not set")
    if (!process.env.STACKUP_API_KEY) throw new Error("STACKUP_API_KEY environment variable not set")
    if (!process.env.FACTORY_ADDRESS) throw new Error("FACTORY_ADDRESS environment variable not set")
    if (!process.env.TEST_PRIVATE_KEY) throw new Error("TEST_PRIVATE_KEY environment variable not set")
    if (!process.env.RPC_URL) throw new Error("RPC_URL environment variable not set")
    if (!process.env.ENTRYPOINT_ADDRESS) throw new Error("ENTRYPOINT_ADDRESS environment variable not set")
    testPrivateKey = process.env.TEST_PRIVATE_KEY as Hex
    factoryAddress = process.env.FACTORY_ADDRESS as Address
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

    test("Smart account client", async () => {
        const smartAccountClient = await getSmartAccountClient()

        const publicClient = await getPublicClient()

        const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas()

        const response = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            value: 0n,
            data: "0x",
            maxFeePerGas,
            maxPriorityFeePerGas
        })

        console.log(response)
    }, 1000000)
})
