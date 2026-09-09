import { type Account, Actions, type Chain, type Client } from "viem"
import { type EntryPoint, SmartAccount, type UserOperation } from "viem/erc4337"
import {
    Abi,
    AbiFunction,
    type Address,
    Hex,
    PersonalMessage,
    TypedData
} from "viem/utils"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"
import { getSenderAddress } from "../../actions/public/getSenderAddress.js"
import {
    TrustEmptyCallsError,
    TrustInvalidCallDataError
} from "../../errors/trust.js"
import type { Assign, OneOf } from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"
import { getUserOperationHash06 } from "../../utils/getUserOperationHash06.js"
import {
    type EntryPointParameter,
    toEntryPoint
} from "../../utils/toEntryPoint.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"

const abi = Abi.from([
    "function execute(address dest, uint256 value, bytes func)",
    "function executeBatch(address[] dest, uint256[] value, bytes[] func)"
])

const factoryAbi = Abi.from([
    "function createAccount(address _verificationFacet, bytes _owner, uint256 _salt) returns (address barz)"
])

const execute = AbiFunction.fromAbi(abi, "execute")
const executeBatch = AbiFunction.fromAbi(abi, "executeBatch")
const createAccount = AbiFunction.fromAbi(factoryAbi, "createAccount")
const executeSelector = AbiFunction.getSelector(execute)
const executeBatchSelector = AbiFunction.getSelector(executeBatch)

const defaultFactoryAddress = "0x729c310186a57833f622630a16d13f710b83272a"
const defaultSecp256k1VerificationFacetAddress =
    "0x81b9E3689390C7e74cF526594A105Dea21a8cdD5"

const stubSignature =
    "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"

type WalletClient = Client.Client<Chain.Chain | undefined, Account.Account>

export type Parameters = {
    client: Client.Client
    owner: OneOf<EthereumProvider | WalletClient | Account.Local>
    address?: Address.Address | undefined
    entryPoint?: EntryPointParameter<"0.6"> | undefined
    factoryAddress?: Address.Address | undefined
    index?: bigint | undefined
    nonceKey?: bigint | undefined
    secp256k1VerificationFacetAddress?: Address.Address | undefined
}

export type Implementation = Assign<
    SmartAccount.Implementation<typeof EntryPoint.abiV06, "0.6">,
    { sign: NonNullable<SmartAccount.Implementation["sign"]> }
>

export type ReturnType = SmartAccount.SmartAccount<Implementation>

export async function from(parameters: Parameters): Promise<ReturnType> {
    const {
        client,
        index = 0n,
        nonceKey,
        factoryAddress = defaultFactoryAddress,
        secp256k1VerificationFacetAddress = defaultSecp256k1VerificationFacetAddress
    } = parameters
    const entryPoint = toEntryPoint(parameters.entryPoint ?? "0.6")
    const owner = await toOwner({ owner: parameters.owner })
    const factoryData = AbiFunction.encodeData(createAccount, [
        secp256k1VerificationFacetAddress,
        owner.address,
        index
    ])

    let address = parameters.address
    let chainId: number | undefined

    const getChainId = async () =>
        (chainId ??=
            client.chain?.id ??
            (await getAction(
                client,
                Actions.chains.getId,
                "chains.getId"
            )(undefined)))

    const getAddress = async () =>
        (address ??= await getSenderAddress(client, {
            factory: factoryAddress,
            factoryData,
            entryPointAddress: entryPoint.address
        }))

    const signHash = async (hash: Hex.Hex) =>
        owner.signTypedData({
            domain: {
                chainId: await getChainId(),
                name: "Barz",
                verifyingContract: await getAddress(),
                version: "v0.2.0"
            },
            types: { BarzMessage: [{ name: "message", type: "bytes" }] },
            primaryType: "BarzMessage",
            message: { message: hash }
        })

    const signMessage = ({ message }: { message: Account.SignableMessage }) =>
        signHash(
            PersonalMessage.getSignPayload(
                typeof message === "string"
                    ? Hex.fromString(message)
                    : message.raw
            )
        )

    const account = await SmartAccount.from({
        client,
        entryPoint,
        getAddress,
        getFactoryArgs() {
            return { factory: factoryAddress, factoryData }
        },
        encodeCalls(calls) {
            if (calls.length > 1)
                return AbiFunction.encodeData(executeBatch, [
                    calls.map((call) => call.to),
                    calls.map((call) => call.value ?? 0n),
                    calls.map((call) => call.data ?? "0x")
                ])
            const call = calls[0]
            if (!call) throw new TrustEmptyCallsError()
            return AbiFunction.encodeData(execute, [
                call.to,
                call.value ?? 0n,
                call.data ?? "0x"
            ])
        },
        decodeCalls(data) {
            const selector = Hex.slice(data, 0, 4)
            if (selector === executeBatchSelector) {
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
            if (selector === executeSelector) {
                const [to, value, func] = AbiFunction.decodeData(execute, data)
                return [{ to, value, data: func }]
            }
            throw new TrustInvalidCallDataError({ selector })
        },
        getStubSignature() {
            return stubSignature
        },
        sign({ hash }) {
            return signMessage({ message: hash })
        },
        signMessage,
        signTypedData(typedData) {
            return signHash(
                TypedData.getSignPayload(typedData as TypedData.encode.Value)
            )
        },
        async signUserOperation(parameters) {
            const { chainId = await getChainId(), ...userOperation } =
                parameters
            return owner.signMessage({
                message: {
                    raw: getUserOperationHash06(
                        {
                            ...userOperation,
                            sender:
                                userOperation.sender ?? (await getAddress()),
                            signature: "0x"
                        } as UserOperation.UserOperation<"0.6">,
                        { chainId, entryPointAddress: entryPoint.address }
                    )
                }
            })
        }
    })

    return Object.assign(account, {
        getNonce: (args?: { key?: bigint | undefined }) =>
            getAccountNonce(client, {
                address: account.address,
                entryPointAddress: entryPoint.address,
                key: args?.key ?? nonceKey ?? 0n
            })
    }) as ReturnType
}
