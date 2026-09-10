import { type Account, Actions, type Chain, type Client } from "viem"
import { SmartAccount, UserOperation } from "viem/erc4337"
import {
    Abi,
    AbiFunction,
    Address,
    Hex,
    PersonalMessage,
    TypedData
} from "viem/utils"
import { EmptyCallsError } from "../../errors/account.js"
import type { Assign, OneOf } from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"
import {
    type EntryPointAbi,
    type EntryPointParameter,
    type ToEntryPointReturnType,
    toEntryPoint
} from "../../utils/toEntryPoint.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"
import { withNonceKey } from "../../utils/withNonceKey.js"

const abi = Abi.from([
    "function execute(address dest, uint256 value, bytes func)",
    "function executeBatch(address[] dest, uint256[] value, bytes[] func)"
])

const factoryAbi = Abi.from([
    "function createAccount(address _admin, bytes _salt) returns (address)",
    "function getAddress(address _adminSigner, bytes _data) view returns (address)"
])

const execute = AbiFunction.fromAbi(abi, "execute")
const executeBatch = AbiFunction.fromAbi(abi, "executeBatch")
const createAccount = AbiFunction.fromAbi(factoryAbi, "createAccount")

const factories = {
    "0.6": { "1.5.20": "0x85e23b94e7F5E9cC1fF78BCe78cfb15B81f0DF00" },
    "0.7": { "1.5.20": "0x4bE0ddfebcA9A5A4a617dee4DeCe99E7c862dceb" }
} as const

const accountMessageTypes = {
    AccountMessage: [{ name: "message", type: "bytes" }]
} as const

const stubSignature =
    "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"

type EntryPointVersion = "0.6" | "0.7"

export type Version = "1.5.20"

export type Parameters<entryPointVersion extends EntryPointVersion = "0.7"> = {
    address?: Address.Address | undefined
    client: Client.Client
    entryPoint?: EntryPointParameter<entryPointVersion> | undefined
    factoryAddress?: Address.Address | undefined
    nonceKey?: bigint | undefined
    owner: OneOf<
        | EthereumProvider
        | Client.Client<Chain.Chain | undefined, Account.Account>
        | Account.Local
    >
    salt?: string | undefined
    version?: Version | undefined
}

export type Implementation<
    entryPointVersion extends EntryPointVersion = "0.7"
> = Assign<
    SmartAccount.Implementation<
        EntryPointAbi<entryPointVersion>,
        entryPointVersion
    >,
    {
        decodeCalls: NonNullable<SmartAccount.Implementation["decodeCalls"]>
        sign: NonNullable<SmartAccount.Implementation["sign"]>
    }
>

export type ReturnType<entryPointVersion extends EntryPointVersion = "0.7"> =
    SmartAccount.SmartAccount<Implementation<entryPointVersion>>

export async function from<entryPointVersion extends EntryPointVersion = "0.7">(
    parameters: Parameters<entryPointVersion>
): Promise<ReturnType<entryPointVersion>> {
    const { client, nonceKey, version = "1.5.20" } = parameters
    const entryPoint = toEntryPoint(
        parameters.entryPoint ?? "0.7"
    ) as ToEntryPointReturnType<entryPointVersion>
    const factory =
        parameters.factoryAddress ?? factories[entryPoint.version][version]
    const salt = parameters.salt ? Hex.fromString(parameters.salt) : "0x"
    const owner = await toOwner({ owner: parameters.owner })

    let address = parameters.address
    let chainId = client.chain?.id

    async function getChainId() {
        chainId ??= await getAction(
            client,
            Actions.chains.getId,
            "chains.getId"
        )(undefined)
        return chainId
    }

    async function getAddress() {
        address ??= await getAction(
            client,
            Actions.contract.read,
            "contract.read"
        )({
            abi: factoryAbi,
            address: factory,
            functionName: "getAddress",
            args: [owner.address, salt]
        })
        return address
    }

    async function signAccountMessage(message: Hex.Hex) {
        return owner.signTypedData({
            domain: {
                name: "Account",
                version: "1",
                chainId: await getChainId(),
                verifyingContract: await getAddress()
            },
            types: accountMessageTypes,
            primaryType: "AccountMessage",
            message: { message }
        })
    }

    function signMessage({ message }: { message: Account.SignableMessage }) {
        return signAccountMessage(
            PersonalMessage.getSignPayload(
                typeof message === "string"
                    ? Hex.fromString(message)
                    : message.raw
            )
        )
    }

    const account = await SmartAccount.from({
        client,
        entryPoint,
        getAddress,
        getFactoryArgs() {
            return {
                factory,
                factoryData: AbiFunction.encodeData(createAccount, [
                    owner.address,
                    salt
                ])
            }
        },
        encodeCalls(calls) {
            const call = calls[0]
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
            if (AbiFunction.fromAbi(abi, data).name === "executeBatch") {
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
        getStubSignature() {
            return stubSignature
        },
        sign({ hash }) {
            return signAccountMessage(hash)
        },
        signMessage,
        async signTypedData(typedData) {
            const {
                domain,
                message,
                primaryType,
                types: types_
            } = typedData as TypedData.Definition
            const verifyingContract = (domain as TypedData.Domain | undefined)
                ?.verifyingContract
            if (
                verifyingContract &&
                Address.isEqual(verifyingContract, await getAddress())
            )
                return owner.signTypedData(typedData)
            const value = {
                domain,
                message,
                primaryType,
                types: {
                    EIP712Domain: TypedData.extractEip712DomainTypes(domain),
                    ...types_
                }
            } as unknown as TypedData.Definition
            TypedData.assert(value)
            return signAccountMessage(TypedData.getSignPayload(value))
        },
        async signUserOperation(parameters) {
            const { chainId = await getChainId(), ...userOperation } =
                parameters
            return owner.signMessage({
                message: {
                    raw: UserOperation.hash(
                        {
                            ...userOperation,
                            sender: userOperation.sender ?? (await getAddress())
                        } as UserOperation.UserOperation<entryPointVersion>,
                        {
                            chainId,
                            entryPointAddress: entryPoint.address,
                            entryPointVersion: entryPoint.version
                        }
                    )
                }
            })
        }
    })

    return withNonceKey(account, {
        nonceKey
    }) as unknown as ReturnType<entryPointVersion>
}
