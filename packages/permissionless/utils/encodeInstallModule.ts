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
} from "../actions/erc7579/supportsModule"
import { AccountNotFoundError } from "../errors"

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

    return modules.map(({ type, address, context, initData }) => ({
        to: account.address,
        value: BigInt(0),
        data: encodeFunctionData({
            abi: [
                {
                    name: "installModule",
                    type: "function",
                    stateMutability: "nonpayable",
                    inputs: [
                        {
                            type: "uint256",
                            name: "moduleTypeId"
                        },
                        {
                            type: "address",
                            name: "module"
                        },
                        {
                            type: "bytes",
                            name: "initData"
                        }
                    ],
                    outputs: []
                }
            ],
            functionName: "installModule",
            args: [
                parseModuleTypeId(type),
                getAddress(address),
                context ?? initData
            ]
        })
    }))
}
