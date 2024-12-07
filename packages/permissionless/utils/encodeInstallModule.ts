import {
    type Address,
    type Hex,
    type OneOf,
    encodeFunctionData,
    getAddress
} from "viem"
import type {
    GetSmartAccountParameter,
    SmartAccount
} from "viem/account-abstraction"
import {
    type ModuleType,
    parseModuleTypeId
} from "../actions/erc7579/supportsModule.js"
import { AccountNotFoundError } from "../errors/index.js"

export type EncodeInstallModuleParameter = {
    type: ModuleType
    address: Address
} & OneOf<
    | {
          context: Hex
      }
    | {
          initData: Hex
      }
>

export type EncodeInstallModuleParameters<
    TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    modules: EncodeInstallModuleParameter[] | EncodeInstallModuleParameter
}

export function encodeInstallModule<
    TSmartAccount extends SmartAccount | undefined
>(parameters: EncodeInstallModuleParameters<TSmartAccount>) {
    const account = parameters.account as SmartAccount

    if (!account) {
        throw new AccountNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const modules = Array.isArray(parameters.modules)
        ? parameters.modules
        : [parameters.modules]

    return modules.map(
        ({ type, address, context, initData }) =>
            ({
                to: account.address,
                value: BigInt(0),
                data: encodeFunctionData({
                    abi: [
                        {
                            type: "function",
                            name: "installModule",
                            inputs: [
                                {
                                    name: "moduleType",
                                    type: "uint256",
                                    internalType: "uint256"
                                },
                                {
                                    name: "module",
                                    type: "address",
                                    internalType: "address"
                                },
                                {
                                    name: "initData",
                                    type: "bytes",
                                    internalType: "bytes"
                                }
                            ],
                            outputs: [],
                            stateMutability: "nonpayable"
                        }
                    ],
                    functionName: "installModule",
                    args: [
                        parseModuleTypeId(type),
                        getAddress(address),
                        context ?? initData
                    ]
                })
            }) as const
    )
}
