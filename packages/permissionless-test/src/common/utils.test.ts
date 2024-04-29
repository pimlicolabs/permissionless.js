import {
    ENTRYPOINT_ADDRESS_V06,
    ENTRYPOINT_ADDRESS_V07,
    type GetSenderAddressParams,
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
    concat,
    encodeFunctionData,
    parseAbi,
    zeroAddress
} from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { beforeAll, describe, expect, expectTypeOf, test } from "vitest"
import {
    SIMPLE_ACCOUNT_FACTORY_V06,
    SIMPLE_ACCOUNT_FACTORY_V07
} from "../constants"
import {
    ensureBundlerIsReady,
    ensurePaymasterIsReady,
    getAnvilWalletClient,
    getBundlerClient,
    getPublicClient,
    getSafeClient
} from "../utils"

const getAccountInitCode = async (
    factoryAddress: Address,
    owner: WalletClient,
    index = 0n
) => {
    if (!owner.account) throw new Error("Owner account not found")
    return {
        factory: factoryAddress,
        factoryData: encodeFunctionData({
            abi: parseAbi([
                "function createAccount(address,uint256) public returns (address)"
            ]),
            args: [owner.account.address, index]
        })
    }
}

describe("test public actions and utils", () => {
    beforeAll(async () => {
        await ensureBundlerIsReady()
        await ensurePaymasterIsReady()
    })

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

    test.each([
        ["v0.6", SIMPLE_ACCOUNT_FACTORY_V06, ENTRYPOINT_ADDRESS_V06],
        ["v0.7", SIMPLE_ACCOUNT_FACTORY_V07, ENTRYPOINT_ADDRESS_V07]
    ])(
        "%s get sender address",
        async (_version, factoryAddress, entryPoint) => {
            const eoaWalletClient = getAnvilWalletClient(25)

            const { factory, factoryData } = await getAccountInitCode(
                factoryAddress,
                eoaWalletClient
            )

            const publicClient = getPublicClient()

            let args: GetSenderAddressParams<typeof entryPoint>

            if (entryPoint === ENTRYPOINT_ADDRESS_V06) {
                args = {
                    initCode: concat([factory, factoryData]),
                    entryPoint: entryPoint
                }
            } else {
                args = {
                    entryPoint: entryPoint,
                    factory,
                    factoryData
                }
            }

            const sender = await getSenderAddress(publicClient, args)

            expect(sender).not.toBeNull()
            expect(sender).not.toBeUndefined()
            expectTypeOf(sender).toMatchTypeOf<Address>()
        }
    )

    test.each([
        ["v0.7", ENTRYPOINT_ADDRESS_V07],
        ["v0.6", ENTRYPOINT_ADDRESS_V06]
    ])("%s getUserOperationHash", async (_version, entryPoint) => {
        const bundlerClient = getBundlerClient(entryPoint)
        const smartAccountClient = await getSafeClient({
            entryPoint
        })

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

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            //@ts-ignore
            userOperation
        })

        userOperation.callGasLimit = gasParameters.callGasLimit
        userOperation.verificationGasLimit = gasParameters.verificationGasLimit
        userOperation.preVerificationGas = gasParameters.preVerificationGas

        const userOpHash = getUserOperationHash({
            userOperation,
            entryPoint,
            chainId: foundry.id
        })

        expect(userOpHash).length.greaterThan(0)
        expectTypeOf(userOpHash).toBeString()
        expectTypeOf(userOpHash).toMatchTypeOf<Hash>()
    })

    test.each([
        ["v0.7", ENTRYPOINT_ADDRESS_V07],
        ["v0.6", ENTRYPOINT_ADDRESS_V06]
    ])("%s signUserOperationHashWithECDSA", async (_version, entryPoint) => {
        const bundlerClient = getBundlerClient(entryPoint)
        const smartAccountClient = await getSafeClient({
            entryPoint
        })

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

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            //@ts-ignore
            userOperation
        })

        userOperation.callGasLimit = gasParameters.callGasLimit
        userOperation.verificationGasLimit = gasParameters.verificationGasLimit
        userOperation.preVerificationGas = gasParameters.preVerificationGas

        const userOpHash = getUserOperationHash({
            userOperation,
            entryPoint,
            chainId: foundry.id
        })

        userOperation.signature = await signUserOperationHashWithECDSA({
            client: smartAccountClient,
            userOperation,
            entryPoint: entryPoint,
            chainId: foundry.id
        })

        expectTypeOf(userOperation.signature).toBeString()
        expectTypeOf(userOperation.signature).toMatchTypeOf<Hex>()

        const signature = await signUserOperationHashWithECDSA({
            client: smartAccountClient,
            hash: userOpHash
        })

        await signUserOperationHashWithECDSA({
            account: smartAccountClient.account,
            hash: userOpHash
        })

        await signUserOperationHashWithECDSA({
            account: smartAccountClient.account,
            userOperation,
            entryPoint: entryPoint,
            chainId: foundry.id
        })

        await signUserOperationHashWithECDSA({
            account: privateKeyToAccount(generatePrivateKey()),
            userOperation,
            entryPoint: entryPoint,
            chainId: foundry.id
        })

        expectTypeOf(userOpHash).toBeString()
        expectTypeOf(userOpHash).toMatchTypeOf<Hash>()
        expect(userOpHash).length.greaterThan(0)

        expect(signature).toEqual(userOperation.signature)
    })

    test.each([
        ["v0.7", ENTRYPOINT_ADDRESS_V07],
        ["v0.6", ENTRYPOINT_ADDRESS_V06]
    ])("%s getRequiredGas", async (_version, entryPoint) => {
        const bundlerClient = getBundlerClient(entryPoint)
        const smartAccountClient = await getSafeClient({
            entryPoint
        })

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

        const gasParameters = await bundlerClient.estimateUserOperationGas({
            //@ts-ignore
            userOperation
        })

        userOperation.callGasLimit = gasParameters.callGasLimit
        userOperation.verificationGasLimit = gasParameters.verificationGasLimit
        userOperation.preVerificationGas = gasParameters.preVerificationGas

        const requiredGas = getRequiredPrefund({
            userOperation,
            entryPoint
        })

        expect(requiredGas).toBe(
            (gasParameters.callGasLimit +
                gasParameters.verificationGasLimit +
                gasParameters.preVerificationGas) *
                userOperation.maxFeePerGas
        )
    })

    test("getPackedUserOperation", async () => {
        const smartAccountClient = await getSafeClient({
            entryPoint: ENTRYPOINT_ADDRESS_V07
        })

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
