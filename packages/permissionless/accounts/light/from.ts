import { type Account, Actions, type Chain, type Client } from "viem"
import { SmartAccount, UserOperation } from "viem/erc4337"
import {
    Abi,
    AbiFunction,
    type Address,
    Hex,
    PersonalMessage,
    TypedData
} from "viem/utils"
import { getSenderAddress } from "../../actions/public/getSenderAddress.js"
import { EmptyCallsError } from "../../errors/account.js"
import { LightSmartAccountUnsupportedVersionError } from "../../errors/light.js"
import type { Assign, OneOf } from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"
import {
    type EntryPointAbi,
    type EntryPointParameter,
    toEntryPoint
} from "../../utils/toEntryPoint.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"
import { withNonceKey } from "../../utils/withNonceKey.js"

export type Version<entryPointVersion extends "0.6" | "0.7" = "0.6" | "0.7"> =
    entryPointVersion extends "0.6" ? "1.1.0" : "2.0.0"

export type Parameters<entryPointVersion extends "0.6" | "0.7" = "0.7"> = {
    address?: Address.Address | undefined
    client: Client.Client
    entryPoint?: EntryPointParameter<entryPointVersion> | undefined
    factoryAddress?: Address.Address | undefined
    index?: bigint | undefined
    nonceKey?: bigint | undefined
    owner: OneOf<
        | EthereumProvider
        | Client.Client<Chain.Chain | undefined, Account.Account>
        | Account.Local
    >
    version?: Version<entryPointVersion> | undefined
}

export type Implementation<
    entryPointVersion extends "0.6" | "0.7" = "0.6" | "0.7"
> = Assign<
    SmartAccount.Implementation<
        EntryPointAbi<entryPointVersion>,
        entryPointVersion
    >,
    { sign: NonNullable<SmartAccount.Implementation["sign"]> }
>

export type ReturnType<entryPointVersion extends "0.6" | "0.7" = "0.7"> =
    SmartAccount.SmartAccount<Implementation<entryPointVersion>>

const abi = /*#__PURE__*/ Abi.from([
    "function execute(address dest, uint256 value, bytes func)",
    "function executeBatch(address[] dest, uint256[] value, bytes[] func)"
])
const execute = /*#__PURE__*/ AbiFunction.fromAbi(abi, "execute")
const executeBatch = /*#__PURE__*/ AbiFunction.fromAbi(abi, "executeBatch")
const createAccount = /*#__PURE__*/ AbiFunction.from(
    "function createAccount(address owner, uint256 salt) returns (address ret)"
)

const versions = { "0.6": "1.1.0", "0.7": "2.0.0" } as const
const factoryAddresses = {
    "1.1.0": "0x00004EC70002a32400f8ae005A26081065620D20",
    "2.0.0": "0x0000000000400CdFef5E2714E63d8040b700BC24"
} as const

const stubSignature =
    "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
const eoaSignatureType = "0x00"

const signWith1271WrapperV1 = (
    signer: Account.Local,
    chainId: number,
    accountAddress: Address.Address,
    hashedMessage: Hex.Hex
) =>
    signer.signTypedData({
        domain: {
            chainId,
            name: "LightAccount",
            verifyingContract: accountAddress,
            version: "1"
        },
        types: { LightAccountMessage: [{ name: "message", type: "bytes" }] },
        primaryType: "LightAccountMessage",
        message: { message: hashedMessage }
    })

export async function from<entryPointVersion extends "0.6" | "0.7" = "0.7">(
    parameters: Parameters<entryPointVersion>
): Promise<ReturnType<entryPointVersion>> {
    const { client, index = 0n, nonceKey, owner } = parameters
    const entryPoint = toEntryPoint(
        (parameters.entryPoint ??
            "0.7") as EntryPointParameter<entryPointVersion>
    )
    const expectedVersion = versions[entryPoint.version]
    const version = parameters.version ?? expectedVersion
    if (!expectedVersion || version !== expectedVersion)
        throw new LightSmartAccountUnsupportedVersionError({
            entryPointVersion: entryPoint.version,
            version
        })
    const factoryAddress =
        parameters.factoryAddress ?? factoryAddresses[version]
    const localOwner = await toOwner({ owner })

    const wrapSignature = (signature: Hex.Hex) =>
        version === "2.0.0"
            ? Hex.concat(eoaSignatureType, signature)
            : signature

    let chainId: number | undefined
    const getChainId = async () => {
        chainId ??=
            client.chain?.id ??
            (await getAction(
                client,
                Actions.chains.getId,
                "chains.getId"
            )(undefined))
        return chainId
    }

    const getFactoryArgs = () => ({
        factory: factoryAddress,
        factoryData: AbiFunction.encodeData(createAccount, [
            localOwner.address,
            index
        ])
    })

    let address = parameters.address
    const getAddress = async () => {
        address ??= await getSenderAddress(client, {
            ...getFactoryArgs(),
            entryPointAddress: entryPoint.address
        })
        return address
    }

    const signMessage = async ({
        message
    }: {
        message: Account.SignableMessage
    }) =>
        wrapSignature(
            await signWith1271WrapperV1(
                localOwner,
                await getChainId(),
                await getAddress(),
                PersonalMessage.getSignPayload(
                    typeof message === "string"
                        ? Hex.fromString(message)
                        : message.raw
                )
            )
        )

    const account = await SmartAccount.from({
        client,
        entryPoint,
        encodeCalls(calls) {
            const [call] = calls
            if (!call) throw new EmptyCallsError()
            if (calls.length === 1)
                return AbiFunction.encodeData(execute, [
                    call.to,
                    call.value ?? 0n,
                    call.data ?? "0x"
                ])
            return AbiFunction.encodeData(executeBatch, [
                calls.map((call) => call.to),
                calls.map((call) => call.value ?? 0n),
                calls.map((call) => call.data ?? "0x")
            ])
        },
        decodeCalls(data) {
            const { name } = AbiFunction.fromAbi(abi, data)
            if (name === "executeBatch") {
                const [dest, value, func] = AbiFunction.decodeData(
                    executeBatch,
                    data
                )
                return dest.map((to, i) => ({
                    to,
                    value: value[i],
                    data: func[i]
                }))
            }
            const [to, value, data_] = AbiFunction.decodeData(execute, data)
            return [{ to, value, data: data_ }]
        },
        getAddress,
        getFactoryArgs,
        getStubSignature: () => wrapSignature(stubSignature),
        sign: ({ hash }) => signMessage({ message: hash }),
        signMessage,
        async signTypedData(typedData) {
            return wrapSignature(
                await signWith1271WrapperV1(
                    localOwner,
                    await getChainId(),
                    await getAddress(),
                    TypedData.getSignPayload(typedData)
                )
            )
        },
        async signUserOperation(parameters) {
            const { chainId = await getChainId(), ...userOperation } =
                parameters
            const hash = UserOperation.hash(
                {
                    ...userOperation,
                    sender: userOperation.sender ?? (await getAddress()),
                    signature: "0x"
                } as UserOperation.UserOperation<entryPointVersion>,
                {
                    chainId,
                    entryPointAddress: entryPoint.address,
                    entryPointVersion: entryPoint.version
                }
            )
            return wrapSignature(
                await localOwner.signMessage({ message: { raw: hash } })
            )
        }
    })

    return withNonceKey(account, { nonceKey }) as ReturnType<entryPointVersion>
}
