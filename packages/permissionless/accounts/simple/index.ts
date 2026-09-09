import { type Account, Actions, type Chain, type Client } from "viem"
import { type EntryPoint, SmartAccount, UserOperation } from "viem/erc4337"
import { AbiFunction, type Address, type Hex } from "viem/utils"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"
import { getSenderAddress } from "../../actions/public/getSenderAddress.js"
import {
    SimpleAccountEmptyCallsError,
    SimpleAccountErc1271UnsupportedError,
    SimpleAccountFactoryAddressRequiredError
} from "../../errors/simple.js"
import type { Assign, OneOf } from "../../types/utils.js"
import { getAction } from "../../utils/getAction.js"
import {
    type EntryPointAbi,
    type EntryPointParameter,
    toEntryPoint
} from "../../utils/toEntryPoint.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"

const factoryAddresses: { [version in EntryPoint.Version]?: Address.Address } =
    {
        "0.6": "0x9406Cc6185a346906296840746125a0E44976454",
        "0.7": "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985",
        "0.8": "0x13E9ed32155810FDbd067D4522C492D6f68E5944"
    }

const implementationAddresses: {
    [version in EntryPoint.Version]?: Address.Address
} = {
    "0.8": "0xe6Cae83BdE06E4c305530e199D7217f42808555B",
    "0.9": "0xa46cc63eBF4Bd77888AA327837d20b23A63a56B5"
}

const stubSignature =
    "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"

const createAccount = AbiFunction.from(
    "function createAccount(address owner, uint256 salt) returns (address ret)"
)
const execute = AbiFunction.from(
    "function execute(address dest, uint256 value, bytes func)"
)
const executeBatch06 = AbiFunction.from(
    "function executeBatch(address[] dest, bytes[] func)"
)
const executeBatch07 = AbiFunction.from(
    "function executeBatch(address[] dest, uint256[] value, bytes[] func)"
)
const executeBatch08 = AbiFunction.from(
    "function executeBatch((address target, uint256 value, bytes data)[] calls)"
)

type Owner = OneOf<
    | EthereumProvider
    | Client.Client<Chain.Chain | undefined, Account.Account>
    | Account.Local
>

export type Parameters<
    entryPointVersion extends EntryPoint.Version = "0.8",
    eip7702 extends boolean = false
> = {
    client: Client.Client
    owner: Owner
    entryPoint?: EntryPointParameter<entryPointVersion> | undefined
    eip7702?: eip7702 | undefined
    nonceKey?: bigint | undefined
} & (eip7702 extends true
    ? {
          entryPoint?: EntryPointParameter<"0.8" | "0.9"> | undefined
          implementation?: Address.Address | undefined
          address?: undefined
          factoryAddress?: undefined
          index?: undefined
      }
    : {
          address?: Address.Address | undefined
          factoryAddress?: Address.Address | undefined
          index?: bigint | undefined
          implementation?: undefined
      })

export type Implementation<
    entryPointVersion extends EntryPoint.Version = "0.8",
    eip7702 extends boolean = false
> = Assign<
    SmartAccount.Implementation<
        EntryPointAbi<entryPointVersion>,
        entryPointVersion,
        object,
        eip7702
    >,
    { sign: NonNullable<SmartAccount.Implementation["sign"]> }
>

export type ReturnType<
    entryPointVersion extends EntryPoint.Version = "0.8",
    eip7702 extends boolean = false
> = SmartAccount.SmartAccount<Implementation<entryPointVersion, eip7702>>

export async function from<
    entryPointVersion extends EntryPoint.Version = "0.8",
    eip7702 extends boolean = false
>(
    parameters: Parameters<entryPointVersion, eip7702>
): Promise<ReturnType<entryPointVersion, eip7702>> {
    const { client, owner, eip7702 = false, index = 0n, nonceKey } = parameters
    const entryPoint = toEntryPoint(
        (parameters.entryPoint ??
            "0.8") as EntryPointParameter<entryPointVersion>
    )
    const localOwner = await toOwner({
        owner,
        address: parameters.address ?? (eip7702 ? owner.address : undefined)
    })

    const factoryArgs = (() => {
        if (eip7702) return undefined
        const factory =
            parameters.factoryAddress ?? factoryAddresses[entryPoint.version]
        if (!factory)
            throw new SimpleAccountFactoryAddressRequiredError({
                entryPointVersion: entryPoint.version
            })
        return {
            factory,
            factoryData: AbiFunction.encodeData(createAccount, [
                localOwner.address,
                index
            ])
        }
    })()

    const address = factoryArgs
        ? (parameters.address ??
          (await getSenderAddress(client, {
              ...factoryArgs,
              entryPointAddress: entryPoint.address
          })))
        : localOwner.address

    let chainId: number | undefined
    const getChainId = async () =>
        (chainId ??=
            client.chain?.id ??
            (await getAction(
                client,
                Actions.chains.getId,
                "chains.getId"
            )(undefined)))

    const executeBatch =
        entryPoint.version === "0.6"
            ? executeBatch06
            : entryPoint.version === "0.7"
              ? executeBatch07
              : executeBatch08

    const account = await SmartAccount.from({
        client,
        entryPoint,
        authorization: factoryArgs
            ? undefined
            : {
                  account: localOwner as Account.PrivateKey,
                  address:
                      parameters.implementation ??
                      (implementationAddresses[
                          entryPoint.version
                      ] as Address.Address)
              },
        getAddress: () => address,
        getFactoryArgs: () =>
            factoryArgs ?? { factory: undefined, factoryData: undefined },
        encodeCalls(calls) {
            const call = calls[0]
            if (!call) throw new SimpleAccountEmptyCallsError()
            if (calls.length === 1)
                return AbiFunction.encodeData(execute, [
                    call.to,
                    call.value ?? 0n,
                    call.data ?? "0x"
                ])
            if (entryPoint.version === "0.6")
                return AbiFunction.encodeData(executeBatch06, [
                    calls.map((call) => call.to),
                    calls.map((call) => call.data ?? "0x")
                ])
            if (entryPoint.version === "0.7")
                return AbiFunction.encodeData(executeBatch07, [
                    calls.map((call) => call.to),
                    calls.map((call) => call.value ?? 0n),
                    calls.map((call) => call.data ?? "0x")
                ])
            return AbiFunction.encodeData(executeBatch08, [
                calls.map((call) => ({
                    target: call.to,
                    value: call.value ?? 0n,
                    data: call.data ?? "0x"
                }))
            ])
        },
        decodeCalls(data) {
            const { name } = AbiFunction.fromAbi([execute, executeBatch], data)
            if (name === "execute") {
                const [to, value, data_] = AbiFunction.decodeData(execute, data)
                return [{ to, value, data: data_ }]
            }
            if (entryPoint.version === "0.6") {
                const [dest, func] = AbiFunction.decodeData(
                    executeBatch06,
                    data
                )
                return dest.map((to, i) => ({
                    to,
                    data: func[i] as Hex.Hex,
                    value: 0n
                }))
            }
            if (entryPoint.version === "0.7") {
                const [dest, value, func] = AbiFunction.decodeData(
                    executeBatch07,
                    data
                )
                return dest.map((to, i) => ({
                    to,
                    data: func[i] as Hex.Hex,
                    value: value[i] as bigint
                }))
            }
            const [calls] = AbiFunction.decodeData(executeBatch08, data)
            return calls.map((call) => ({
                to: call.target,
                data: call.data,
                value: call.value
            }))
        },
        getStubSignature: () => stubSignature,
        sign() {
            throw new SimpleAccountErc1271UnsupportedError()
        },
        signMessage() {
            throw new SimpleAccountErc1271UnsupportedError()
        },
        signTypedData() {
            throw new SimpleAccountErc1271UnsupportedError()
        },
        async signUserOperation(options) {
            const { chainId = await getChainId(), ...userOperation } = options
            const sender = userOperation.sender ?? address
            if (entryPoint.version === "0.8" || entryPoint.version === "0.9") {
                return localOwner.signTypedData(
                    UserOperation.toTypedData(
                        {
                            ...userOperation,
                            sender,
                            signature: "0x"
                        } as UserOperation.UserOperation<"0.8" | "0.9", true>,
                        { chainId, entryPointAddress: entryPoint.address }
                    )
                )
            }
            return localOwner.signMessage({
                message: {
                    raw: UserOperation.hash(
                        {
                            ...userOperation,
                            sender,
                            signature: "0x"
                        } as UserOperation.UserOperation,
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

    return Object.assign(account, {
        getNonce: ({
            key = nonceKey ?? 0n
        }: SmartAccount.getNonce.Options = {}) =>
            getAccountNonce(client, {
                address,
                entryPointAddress: entryPoint.address,
                key
            })
    }) as unknown as ReturnType<entryPointVersion, eip7702>
}
