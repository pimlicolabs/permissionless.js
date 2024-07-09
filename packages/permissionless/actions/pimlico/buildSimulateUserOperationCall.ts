import {
    type Address,
    type BlockTag,
    type CallParameters,
    type Chain,
    type Client,
    type Hex,
    type StateOverride,
    type Transport,
    encodeFunctionData,
    getAddress,
    zeroAddress
} from "viem"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    EntryPoint,
    GetEntryPointVersion as GetEntryPointVersionType,
    Prettify,
    UserOperation
} from "../../types"
import { getEntryPointPaymasterDepositOverrides } from "../../utils/getEntryPointPaymasterDepositOverrides"
import {
    isEntryPointVersion06,
    isEntryPointVersion07,
    isUserOperationVersion06,
    isUserOperationVersion07
} from "../../utils/getEntryPointVersion"
import { getPackedUserOperation } from "../../utils/getPackedUserOperation"

const PIMLICO_ENTRYPOINT_SIMULATIONS_ADDRESS: Hex = getAddress(
    "0x74Cb5e4eE81b86e70f9045036a1C5477de69eE87"
)
export const PimlicoEntryPointSimulationsAbi = [
    {
        inputs: [],
        stateMutability: "nonpayable",
        type: "constructor"
    },
    {
        inputs: [
            {
                internalType: "address payable",
                name: "ep",
                type: "address"
            },
            {
                internalType: "bytes[]",
                name: "data",
                type: "bytes[]"
            }
        ],
        name: "simulateEntryPoint",
        outputs: [
            {
                internalType: "bytes[]",
                name: "",
                type: "bytes[]"
            }
        ],
        stateMutability: "nonpayable",
        type: "function"
    }
]

const EntryPointSimulateHandleOpV07Abi = [
    {
        type: "function",
        name: "simulateHandleOp",
        inputs: [
            {
                name: "op",
                type: "tuple",
                internalType: "struct PackedUserOperation",
                components: [
                    {
                        name: "sender",
                        type: "address",
                        internalType: "address"
                    },
                    { name: "nonce", type: "uint256", internalType: "uint256" },
                    { name: "initCode", type: "bytes", internalType: "bytes" },
                    { name: "callData", type: "bytes", internalType: "bytes" },
                    {
                        name: "accountGasLimits",
                        type: "bytes32",
                        internalType: "bytes32"
                    },
                    {
                        name: "preVerificationGas",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "gasFees",
                        type: "bytes32",
                        internalType: "bytes32"
                    },
                    {
                        name: "paymasterAndData",
                        type: "bytes",
                        internalType: "bytes"
                    },
                    { name: "signature", type: "bytes", internalType: "bytes" }
                ]
            }
        ],
        outputs: [
            {
                name: "",
                type: "tuple",
                internalType: "struct IEntryPointSimulations.ExecutionResult",
                components: [
                    {
                        name: "preOpGas",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    { name: "paid", type: "uint256", internalType: "uint256" },
                    {
                        name: "accountValidationData",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "paymasterValidationData",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "paymasterVerificationGasLimit",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "paymasterPostOpGasLimit",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "targetSuccess",
                        type: "bool",
                        internalType: "bool"
                    },
                    {
                        name: "targetResult",
                        type: "bytes",
                        internalType: "bytes"
                    }
                ]
            }
        ],
        stateMutability: "nonpayable"
    }
]
const EntryPointSimulateHandleOpV06Abi = [
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "address",
                        name: "sender",
                        type: "address"
                    },
                    {
                        internalType: "uint256",
                        name: "nonce",
                        type: "uint256"
                    },
                    {
                        internalType: "bytes",
                        name: "initCode",
                        type: "bytes"
                    },
                    {
                        internalType: "bytes",
                        name: "callData",
                        type: "bytes"
                    },
                    {
                        internalType: "uint256",
                        name: "callGasLimit",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "verificationGasLimit",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "preVerificationGas",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "maxFeePerGas",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "maxPriorityFeePerGas",
                        type: "uint256"
                    },
                    {
                        internalType: "bytes",
                        name: "paymasterAndData",
                        type: "bytes"
                    },
                    {
                        internalType: "bytes",
                        name: "signature",
                        type: "bytes"
                    }
                ],
                internalType: "struct UserOperation",
                name: "op",
                type: "tuple"
            },
            {
                internalType: "address",
                name: "target",
                type: "address"
            },
            {
                internalType: "bytes",
                name: "targetCallData",
                type: "bytes"
            }
        ],
        name: "simulateHandleOp",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
]

export type GetEntryPointSimulationsParams<
    TEntryPoint extends EntryPoint,
    TEntryPointCode extends Hex | undefined
> = TEntryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE
    ? {
          entryPointCode?: TEntryPointCode
          targetAddress?: Address
          targetCallData?: Hex
      }
    : {
          pimlicoEntryPointSimulationsAddress: Address
      }

export type BuildSimulateUserOperationCallParams<
    TEntryPoint extends EntryPoint,
    TEntryPointCode extends Hex | undefined
> = {
    entryPoint: TEntryPoint
    userOperation: UserOperation<GetEntryPointVersionType<TEntryPoint>>
    stateOverrides?: StateOverride
    balanceOverride?: boolean
    paymasterDepositOverride?: boolean
} & (
    | {
          blockNumber?: bigint
          blockTag?: never
      }
    | {
          blockNumber?: never
          blockTag?: BlockTag
      }
) &
    GetEntryPointSimulationsParams<TEntryPoint, TEntryPointCode>

const buildSimulateUserOperationCallV06 = <
    TEntryPointCode extends Hex | undefined,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    _client: Client<TTransport, TChain>,
    args: Prettify<
        BuildSimulateUserOperationCallParams<
            ENTRYPOINT_ADDRESS_V06_TYPE,
            TEntryPointCode
        >
    >
): CallParameters<TChain> => {
    const {
        entryPoint,
        userOperation,
        entryPointCode,
        blockNumber,
        blockTag,
        targetAddress,
        targetCallData,
        stateOverrides
    } = args

    const existingEntryPointStateOverrides = stateOverrides?.find(
        (stateOverride) => stateOverride.address === entryPoint
    )

    const finalStateOverrides: StateOverride | undefined = entryPointCode
        ? [
              ...(stateOverrides ?? []),
              {
                  ...existingEntryPointStateOverrides,
                  address: entryPoint,
                  code: entryPointCode
              }
          ]
        : stateOverrides

    const params: CallParameters<TChain> = blockNumber
        ? {
              to: entryPoint,
              data: encodeFunctionData({
                  abi: EntryPointSimulateHandleOpV06Abi,
                  functionName: "simulateHandleOp",
                  args: [
                      userOperation,
                      targetAddress ?? zeroAddress,
                      targetCallData ?? "0x"
                  ]
              }),
              blockNumber,
              stateOverrides: finalStateOverrides
          }
        : {
              to: entryPoint,
              data: encodeFunctionData({
                  abi: EntryPointSimulateHandleOpV06Abi,
                  functionName: "simulateHandleOp",
                  args: [
                      userOperation,
                      targetAddress ?? zeroAddress,
                      targetCallData ?? "0x"
                  ]
              }),
              stateOverrides: finalStateOverrides,
              blockTag: blockTag ?? "pending"
          }

    return params
}

const buildSimulateUserOperationCallV07 = <
    TEntryPointCode extends Hex | undefined,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    _client: Client<TTransport, TChain>,
    args: Prettify<
        BuildSimulateUserOperationCallParams<
            ENTRYPOINT_ADDRESS_V07_TYPE,
            TEntryPointCode
        >
    >
): CallParameters<TChain> => {
    const {
        entryPoint,
        userOperation,
        blockNumber,
        blockTag,
        stateOverrides,
        pimlicoEntryPointSimulationsAddress
    } = args

    const packedUserOperation = getPackedUserOperation(userOperation)

    const entryPointSimulationsSimulateHandleOpCallData = encodeFunctionData({
        abi: EntryPointSimulateHandleOpV07Abi,
        functionName: "simulateHandleOp",
        args: [packedUserOperation]
    })

    const callData = encodeFunctionData({
        abi: PimlicoEntryPointSimulationsAbi,
        functionName: "simulateEntryPoint",
        args: [entryPoint, [entryPointSimulationsSimulateHandleOpCallData]]
    })

    const params: CallParameters<TChain> = blockNumber
        ? {
              to: pimlicoEntryPointSimulationsAddress,
              data: callData,
              blockNumber,
              stateOverrides
          }
        : {
              to: pimlicoEntryPointSimulationsAddress,
              data: callData,
              stateOverrides,
              blockTag: blockTag ?? "pending"
          }

    return params
}

/**
 * Simulate the user operation.
 *
 * - Docs: https://docs.pimlico.io/permissionless/reference/public-actions/simulateUserOperation
 *
 * @param client {@link client} that you created using viem's createPublicClient.
 * @param args {@link GetAccountNonceParams} address, entryPoint & key
 *
 * @example
 * import { createPublicClient } from "viem"
 * import { simulateUserOperation } from "permissionless/actions/public"
 *
 * const client = createPublicClient({
 *      chain: goerli,
 *      transport: http("https://goerli.infura.io/v3/your-infura-key")
 * })
 *
 * const nonce = await simulateUserOperation(client, {
 *    entryPoint,
 *    userOperation
 * })
 *
 * // Return 0n
 */
export const buildSimulateUserOperationCall = <
    TEntryPoint extends EntryPoint,
    TEntryPointCode extends Address | undefined,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined
>(
    client: Client<TTransport, TChain>,
    args: BuildSimulateUserOperationCallParams<TEntryPoint, TEntryPointCode>
): CallParameters<TChain> => {
    const {
        entryPoint,
        userOperation,
        stateOverrides,
        balanceOverride,
        paymasterDepositOverride
    } = args

    const finalStateOverrides: StateOverride = stateOverrides ?? []

    if (balanceOverride) {
        finalStateOverrides.push({
            address: userOperation.sender,
            balance: BigInt(
                "0x7ffffffffffffffffffffffffffff17fffffffffffffffffffffffffffffffff"
            )
        })
    }

    if (paymasterDepositOverride) {
        let paymaster: Address | undefined = undefined

        if (isUserOperationVersion06(entryPoint, userOperation)) {
            paymaster = userOperation.paymasterAndData
                ? getAddress(userOperation.paymasterAndData.slice(0, 42))
                : undefined
        }
        if (isUserOperationVersion07(entryPoint, userOperation)) {
            paymaster = userOperation.paymaster ?? undefined
        }

        if (paymaster) {
            finalStateOverrides.concat(
                getEntryPointPaymasterDepositOverrides({
                    entryPoint,
                    paymaster,
                    amount: BigInt(
                        "0x7ffffffffffffffffffffffffffff17fffffffffffffffffffffffffffffffff"
                    )
                })
            )
        }
    }

    if (isEntryPointVersion06(entryPoint)) {
        if (
            "initCode" in userOperation &&
            "paymasterAndData" in userOperation
        ) {
            return buildSimulateUserOperationCallV06(client, {
                entryPoint,
                userOperation: userOperation as UserOperation<"v0.6">,
                entryPointCode: (
                    args as BuildSimulateUserOperationCallParams<
                        ENTRYPOINT_ADDRESS_V06_TYPE,
                        undefined
                    >
                ).entryPointCode,
                stateOverrides: finalStateOverrides
            })
        }
        throw new Error("UserOperation is not v0.6")
    }
    if (isEntryPointVersion07(entryPoint)) {
        if ("factory" in userOperation && "paymaster" in userOperation) {
            return buildSimulateUserOperationCallV07(client, {
                entryPoint,
                userOperation: userOperation as UserOperation<"v0.7">,
                pimlicoEntryPointSimulationsAddress:
                    (
                        args as BuildSimulateUserOperationCallParams<
                            ENTRYPOINT_ADDRESS_V07_TYPE,
                            Hex
                        >
                    ).pimlicoEntryPointSimulationsAddress ??
                    PIMLICO_ENTRYPOINT_SIMULATIONS_ADDRESS,
                stateOverrides: finalStateOverrides
            })
        }
        throw new Error("UserOperation is not v0.7")
    }
    throw new Error("EntryPoint is not recognized")
}
