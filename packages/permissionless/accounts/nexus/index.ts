import { type Account, Actions, type Chain, type Client } from "viem"
import { type EntryPoint, SmartAccount, UserOperation } from "viem/erc4337"
import {
    Abi,
    AbiFunction,
    AbiParameters,
    type Address,
    Hash,
    Hex,
    PersonalMessage,
    TypedData
} from "viem/utils"
import type { Assign, OneOf } from "../../types/utils.js"
import { decode7579Calls } from "../../utils/decode7579Calls.js"
import { encode7579Calls } from "../../utils/encode7579Calls.js"
import { getAction } from "../../utils/getAction.js"
import { sortAddresses } from "../../utils/sortAddresses.js"
import {
    type EntryPointParameter,
    toEntryPoint
} from "../../utils/toEntryPoint.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"
import { withNonceKey } from "../../utils/withNonceKey.js"

const factoryAbi = Abi.from([
    "function createAccount(address eoaOwner, uint256 index, address[] attesters, uint8 threshold) returns (address)",
    "function computeAccountAddress(address eoaOwner, uint256 index, address[] attesters, uint8 threshold) view returns (address)"
])
const createAccount = AbiFunction.fromAbi(factoryAbi, "createAccount")

const defaultFactoryAddress = "0x00000bb19a3579F4D779215dEf97AFbd0e30DB55"
const defaultValidatorAddress = "0x00000004171351c442B202678c48D8AB5B321E8f"
const nonceKeyModulus = 16777215n
const personalSignTypeHash = Hash.keccak256(
    Hex.fromString("PersonalSign(bytes prefixed)")
)

export type Version = "1.0.0"

export type Parameters = {
    client: Client.Client
    owner: OneOf<
        | EthereumProvider
        | Client.Client<Chain.Chain | undefined, Account.Account>
        | Account.Local
    >
    version?: Version | undefined
    address?: Address.Address | undefined
    entryPoint?: EntryPointParameter<"0.7"> | undefined
    index?: bigint | undefined
    factoryAddress?: Address.Address | undefined
    validatorAddress?: Address.Address | undefined
    attesters?: Address.Address[] | undefined
    threshold?: number | undefined
    nonceKey?: bigint | undefined
}

export type Implementation = Assign<
    SmartAccount.Implementation<typeof EntryPoint.abiV07, "0.7", object, false>,
    {
        decodeCalls: NonNullable<SmartAccount.Implementation["decodeCalls"]>
        sign: NonNullable<SmartAccount.Implementation["sign"]>
    }
>

export type ReturnType = SmartAccount.SmartAccount<Implementation>

export async function from(parameters: Parameters): Promise<ReturnType> {
    const {
        client,
        index = 0n,
        version = "1.0.0",
        factoryAddress = defaultFactoryAddress,
        validatorAddress = defaultValidatorAddress,
        attesters = [],
        threshold = 0,
        nonceKey = 0n
    } = parameters
    const owner = await toOwner({ owner: parameters.owner })
    const entryPoint = toEntryPoint(parameters.entryPoint ?? "0.7")
    const factoryArgs = [
        owner.address,
        index,
        sortAddresses(attesters),
        threshold
    ] as const

    let address = parameters.address
    async function getAddress() {
        address ??= await getAction(
            client,
            Actions.contract.read,
            "contract.read"
        )({
            address: factoryAddress,
            abi: factoryAbi,
            functionName: "computeAccountAddress",
            args: factoryArgs
        })
        return address
    }

    let chainId = client.chain?.id
    async function getChainId() {
        chainId ??= await getAction(
            client,
            Actions.chains.getId,
            "chains.getId"
        )(undefined)
        return chainId
    }

    async function wrapMessageHash(hash: Hex.Hex) {
        return Hash.keccak256(
            Hex.concat(
                "0x1901",
                TypedData.domainSeparator({
                    name: "Nexus",
                    version,
                    chainId: await getChainId(),
                    verifyingContract: await getAddress()
                }),
                Hash.keccak256(
                    AbiParameters.encode(
                        [{ type: "bytes32" }, { type: "bytes32" }],
                        [personalSignTypeHash, hash]
                    )
                )
            )
        )
    }

    async function signHash(hash: Hex.Hex) {
        return AbiParameters.encodePacked(
            ["address", "bytes"],
            [
                validatorAddress,
                await owner.signMessage({
                    message: { raw: await wrapMessageHash(hash) }
                })
            ]
        )
    }

    const implementation: Implementation = {
        client,
        entryPoint,
        getAddress,
        getFactoryArgs() {
            return {
                factory: factoryAddress,
                factoryData: AbiFunction.encodeData(createAccount, factoryArgs)
            }
        },
        encodeCalls(calls) {
            return encode7579Calls({
                mode: {
                    type: calls.length > 1 ? "batchcall" : "call",
                    revertOnError: false,
                    selector: "0x",
                    context: "0x"
                },
                callData: calls
            })
        },
        decodeCalls(callData) {
            return decode7579Calls(callData).callData
        },
        getStubSignature() {
            return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${validatorAddress.slice(2)}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`
        },
        sign({ hash }) {
            return signHash(hash)
        },
        signMessage({ message }) {
            return signHash(
                PersonalMessage.getSignPayload(
                    typeof message === "string"
                        ? Hex.fromString(message)
                        : message.raw
                )
            )
        },
        signTypedData(typedData) {
            return signHash(TypedData.getSignPayload(typedData))
        },
        async signUserOperation(parameters) {
            const { chainId = await getChainId(), ...userOperation } =
                parameters
            const hash = UserOperation.hash(
                {
                    ...userOperation,
                    sender: userOperation.sender ?? (await getAddress()),
                    signature: "0x"
                } as UserOperation.UserOperation<"0.7">,
                {
                    chainId,
                    entryPointAddress: entryPoint.address,
                    entryPointVersion: entryPoint.version
                }
            )
            return owner.signMessage({ message: { raw: hash } })
        }
    }

    return withNonceKey(await SmartAccount.from(implementation), {
        nonceKey,
        encodeKey: (key) =>
            Hex.toBigInt(
                Hex.concat(
                    Hex.fromNumber(key % nonceKeyModulus, { size: 3 }),
                    "0x00",
                    validatorAddress
                )
            )
    })
}
