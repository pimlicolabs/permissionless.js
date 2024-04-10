import dotenv from "dotenv"
import {
    UserOperation,
    deepHexlify,
    getSenderAddress,
    getUserOperationHash
} from "permissionless"
import type { PackedUserOperation } from "permissionless/types"
import {
    getPackedUserOperation,
    getRequiredPrefund,
    signUserOperationHashWithECDSA
} from "permissionless/utils"
import {
    type Address,
    type Hash,
    type Hex,
    type WalletClient,
    encodeFunctionData,
    zeroAddress
} from "viem"
import { beforeAll, describe, expect, expectTypeOf, test } from "vitest"
import { SimpleAccountFactoryAbi } from "../abis/SimpleAccountFactory"
import {
    getBundlerClient,
    getEntryPoint,
    getEoaWalletClient,
    getFactoryAddress,
    getPrivateKeyAccount,
    getPublicClient,
    getSmartAccountClient,
    getTestingChain
} from "./utils"

dotenv.config()

export const getAccountInitCode = async (
    factoryAddress: Address,
    owner: WalletClient,
    index = 0n
) => {
    if (!owner.account) throw new Error("Owner account not found")
    return {
        factory: factoryAddress,
        factoryData: encodeFunctionData({
            abi: SimpleAccountFactoryAbi,
            functionName: "createAccount",
            args: [owner.account.address, index]
        })
    }
}

beforeAll(() => {
    if (!process.env.FACTORY_ADDRESS_V07)
        throw new Error("FACTORY_ADDRESS_V07 environment variable not set")
    if (!process.env.TEST_PRIVATE_KEY)
        throw new Error("TEST_PRIVATE_KEY environment variable not set")
    if (!process.env.RPC_URL)
        throw new Error("RPC_URL environment variable not set")
})

describe("test public actions and utils", () => {
    test("Test deep Hexlify", async () => {
        console.log("Testing deep hexlify")
        expect(deepHexlify("abcd")).toBe("abcd")
        expect(deepHexlify(null)).toBe(null)
        expect(deepHexlify(true)).toBe(true)
        expect(deepHexlify(false)).toBe(false)
        expect(deepHexlify(1n)).toBe("0x1")
        expect(
            deepHexlify({
                name: "Garvit",
                balance: 1n
            })
        ).toEqual({
            name: "Garvit",
            balance: "0x1"
        })
    })
    test("get sender address", async () => {
        const eoaWalletClient = getEoaWalletClient()
        const factoryAddress = getFactoryAddress()

        const { factory, factoryData } = await getAccountInitCode(
            factoryAddress,
            eoaWalletClient
        )
        const publicClient = getPublicClient()
        const entryPoint = getEntryPoint()

        const sender = await getSenderAddress(publicClient, {
            factory,
            factoryData,
            entryPoint
        })

        expect(sender).not.toBeNull()
        expect(sender).not.toBeUndefined()
        expectTypeOf(sender).toMatchTypeOf<Address>()
    })

    test("getUserOperationHash", async () => {
        const chain = getTestingChain()
        const entryPoint = getEntryPoint()
        const bundlerClient = getBundlerClient()
        const simpleAccountClient = await getSmartAccountClient()

        const userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    })
                }
            })

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            userOperation
        })

        userOperation.callGasLimit = gasParameters.callGasLimit
        userOperation.verificationGasLimit = gasParameters.verificationGasLimit
        userOperation.preVerificationGas = gasParameters.preVerificationGas

        const userOpHash = getUserOperationHash({
            userOperation,
            entryPoint,
            chainId: chain.id
        })

        expect(userOpHash).length.greaterThan(0)
        expectTypeOf(userOpHash).toBeString()
        expectTypeOf(userOpHash).toMatchTypeOf<Hash>()
    })

    test("signUserOperationHashWithECDSA", async () => {
        const bundlerClient = getBundlerClient()
        const simpleAccountClient = await getSmartAccountClient()

        const userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    })
                }
            })

        const entryPoint = getEntryPoint()
        const chain = getTestingChain()

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            userOperation
        })

        userOperation.callGasLimit = gasParameters.callGasLimit
        userOperation.verificationGasLimit = gasParameters.verificationGasLimit
        userOperation.preVerificationGas = gasParameters.preVerificationGas

        const userOpHash = getUserOperationHash({
            userOperation,
            entryPoint,
            chainId: chain.id
        })

        userOperation.signature = await signUserOperationHashWithECDSA({
            client: simpleAccountClient,
            userOperation,
            entryPoint: entryPoint,
            chainId: chain.id
        })

        expectTypeOf(userOperation.signature).toBeString()
        expectTypeOf(userOperation.signature).toMatchTypeOf<Hex>()

        const signature = await signUserOperationHashWithECDSA({
            client: simpleAccountClient,
            hash: userOpHash
        })

        await signUserOperationHashWithECDSA({
            account: simpleAccountClient.account,
            hash: userOpHash
        })

        await signUserOperationHashWithECDSA({
            account: simpleAccountClient.account,
            userOperation,
            entryPoint: entryPoint,
            chainId: chain.id
        })

        await signUserOperationHashWithECDSA({
            account: getPrivateKeyAccount(),
            userOperation,
            entryPoint: entryPoint,
            chainId: chain.id
        })

        expectTypeOf(userOpHash).toBeString()
        expectTypeOf(userOpHash).toMatchTypeOf<Hash>()
        expect(userOpHash).length.greaterThan(0)

        expect(signature).toEqual(userOperation.signature)
    })

    test("getRequiredGas", async () => {
        const bundlerClient = getBundlerClient()
        const simpleAccountClient = await getSmartAccountClient()

        const userOperation =
            await simpleAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await simpleAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    })
                }
            })

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            userOperation
        })

        userOperation.callGasLimit = gasParameters.callGasLimit
        userOperation.verificationGasLimit = gasParameters.verificationGasLimit
        userOperation.preVerificationGas = gasParameters.preVerificationGas

        const requiredGas = getRequiredPrefund({
            userOperation,
            entryPoint: getEntryPoint()
        })

        expect(requiredGas).toBe(
            (gasParameters.callGasLimit +
                gasParameters.verificationGasLimit +
                gasParameters.preVerificationGas) *
                userOperation.maxFeePerGas
        )
    })

    test("getPackedUserOperation", async () => {
        const smartAccountClient = await getSmartAccountClient()

        const userOperation =
            await smartAccountClient.prepareUserOperationRequest({
                userOperation: {
                    callData: await smartAccountClient.account.encodeCallData({
                        to: zeroAddress,
                        value: 0n,
                        data: "0x"
                    })
                }
            })

        const packedUserOperation = getPackedUserOperation(userOperation)

        expectTypeOf(packedUserOperation).toMatchTypeOf<PackedUserOperation>()
    })
})
