import { type Account, Actions, type Chain, type Client } from "viem"
import { type EntryPoint, SmartAccount, UserOperation } from "viem/erc4337"
import { Abi, AbiFunction, AbiParameters, type Address, Hex } from "viem/utils"
import { getSenderAddress } from "../../actions/public/getSenderAddress.js"
import { EtherspotNonceKeyOverflowError } from "../../errors/etherspot.js"
import type { Assign, OneOf } from "../../types/utils.js"
import { decode7579Calls } from "../../utils/decode7579Calls.js"
import { encode7579Calls } from "../../utils/encode7579Calls.js"
import { getAction } from "../../utils/getAction.js"
import {
    type EntryPointParameter,
    toEntryPoint
} from "../../utils/toEntryPoint.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"
import { withNonceKey } from "../../utils/withNonceKey.js"

const bootstrapAbi = /*#__PURE__*/ Abi.from([
    "function initMSA((address module, bytes data)[] validators, (address module, bytes data)[] executors, (address module, bytes data) hook, (address module, bytes data)[] fallbacks)",
    "function onInstall(bytes data)"
])
const factoryAbi = /*#__PURE__*/ Abi.from([
    "function createAccount(bytes32 salt, bytes initCode) payable returns (address)"
])

const initMSA = /*#__PURE__*/ AbiFunction.fromAbi(bootstrapAbi, "initMSA")
const onInstall = /*#__PURE__*/ AbiFunction.fromAbi(bootstrapAbi, "onInstall")
const createAccount = /*#__PURE__*/ AbiFunction.fromAbi(
    factoryAbi,
    "createAccount"
)

const defaults = {
    metaFactoryAddress: "0x2A40091f044e48DEB5C0FCbc442E443F3341B451",
    bootstrapAddress: "0x0D5154d7751b6e2fDaa06F0cC9B400549394C8AA",
    validatorAddress: "0x0740Ed7c11b9da33d9C80Bd76b826e4E90CC1906"
} as const

const zeroAddress = "0x0000000000000000000000000000000000000000"
const maxNonceKey = 0xffffn
const stubSignature =
    "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"

type Owner = OneOf<
    | EthereumProvider
    | Client.Client<Chain.Chain | undefined, Account.Account>
    | Account.Local
>

export type Parameters = {
    address?: Address.Address | undefined
    bootstrapAddress?: Address.Address | undefined
    client: Client.Client
    entryPoint?: EntryPointParameter<"0.7"> | undefined
    index?: bigint | undefined
    metaFactoryAddress?: Address.Address | undefined
    nonceKey?: bigint | undefined
    owner: Owner
    validatorAddress?: Address.Address | undefined
}

export type Implementation = Assign<
    SmartAccount.Implementation<typeof EntryPoint.abiV07, "0.7">,
    { sign: NonNullable<SmartAccount.Implementation["sign"]> }
>

export type ReturnType = SmartAccount.SmartAccount<Implementation>

export async function from(parameters: Parameters): Promise<ReturnType> {
    const {
        client,
        index = 0n,
        metaFactoryAddress = defaults.metaFactoryAddress,
        validatorAddress = defaults.validatorAddress,
        bootstrapAddress = defaults.bootstrapAddress,
        nonceKey = 0n
    } = parameters
    const owner = await toOwner({ owner: parameters.owner })
    const entryPoint = toEntryPoint(parameters.entryPoint ?? "0.7")

    const bootstrapConfig = (module: Address.Address) => ({
        module,
        data: AbiFunction.encodeData(onInstall, ["0x"])
    })
    const factoryData = AbiFunction.encodeData(createAccount, [
        Hex.fromNumber(index, { size: 32 }),
        AbiParameters.encode(
            [{ type: "address" }, { type: "address" }, { type: "bytes" }],
            [
                owner.address,
                bootstrapAddress,
                AbiFunction.encodeData(initMSA, [
                    [bootstrapConfig(validatorAddress)],
                    [bootstrapConfig(zeroAddress)],
                    bootstrapConfig(zeroAddress),
                    [bootstrapConfig(zeroAddress)]
                ])
            ]
        )
    ])

    let address = parameters.address
    const getAddress = async () => {
        address ??= await getSenderAddress(client, {
            factory: metaFactoryAddress,
            factoryData,
            entryPointAddress: entryPoint.address
        })
        return address
    }

    const getChainId = async () =>
        client.chain?.id ??
        (await getAction(
            client,
            Actions.chains.getId,
            "chains.getId"
        )(undefined))

    const encodeNonceKey = (key: bigint) => {
        if (key > maxNonceKey) throw new EtherspotNonceKeyOverflowError({ key })
        return BigInt(
            Hex.concat(
                validatorAddress,
                "0x0000",
                Hex.fromNumber(key, { size: 2 })
            )
        )
    }

    const withValidator = (signature: Hex.Hex) => {
        const v = Number.parseInt(signature.slice(-2), 16)
        return Hex.concat(
            validatorAddress,
            v === 27 || v === 28
                ? signature
                : (`${signature.slice(0, -2)}${(v + 27).toString(16)}` as Hex.Hex)
        )
    }

    const signMessage: Implementation["signMessage"] = async ({ message }) =>
        withValidator(await owner.signMessage({ message }))

    const account = await SmartAccount.from({
        client,
        entryPoint,
        decodeCalls: (data) => decode7579Calls(data).callData,
        encodeCalls: (calls) =>
            encode7579Calls({
                mode: {
                    type: calls.length > 1 ? "batchcall" : "call",
                    revertOnError: false,
                    selector: "0x",
                    context: "0x"
                },
                callData: calls
            }),
        getAddress,
        getFactoryArgs: () => ({ factory: metaFactoryAddress, factoryData }),
        getStubSignature: () => stubSignature,
        sign: ({ hash }) => signMessage({ message: { raw: hash } }),
        signMessage,
        signTypedData: async (typedData) =>
            withValidator(await owner.signTypedData(typedData)),
        async signUserOperation(options) {
            const { chainId = await getChainId(), ...userOperation } = options
            const hash = UserOperation.hash(
                {
                    ...userOperation,
                    sender: userOperation.sender ?? (await getAddress())
                } as UserOperation.UserOperation<"0.7">,
                {
                    chainId,
                    entryPointAddress: entryPoint.address,
                    entryPointVersion: entryPoint.version
                }
            )
            return owner.signMessage({ message: { raw: hash } })
        }
    })
    return withNonceKey(account, {
        nonceKey,
        encodeKey: encodeNonceKey
    }) as ReturnType
}
