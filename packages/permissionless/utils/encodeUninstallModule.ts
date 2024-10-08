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

export type EncodeUninstallModuleParameter = {
    type: ModuleType
    address: Address
} & OneOf<
    | {
          context: Hex
      }
    | {
          deInitData: Hex
      }
>

export type EncodeUninstallModuleParameters<
    TSmartAccount extends SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    modules: EncodeUninstallModuleParameter[] | EncodeUninstallModuleParameter
}

export function encodeUninstallModule<
    TSmartAccount extends SmartAccount | undefined
>(parameters: EncodeUninstallModuleParameters<TSmartAccount>) {
    const account = parameters.account as SmartAccount

    if (!account) {
        throw new AccountNotFoundError({
            docsPath: "/docs/actions/wallet/sendTransaction"
        })
    }

    const modules = Array.isArray(parameters.modules)
        ? parameters.modules
        : [parameters.modules]

    return modules.map(({ type, address, context, deInitData }) => ({
        to: account.address,
        value: BigInt(0),
        data: encodeFunctionData({
            abi: [
                {
                    name: "uninstallModule",
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
                            name: "deInitData"
                        }
                    ],
                    outputs: []
                }
            ],
            functionName: "uninstallModule",
            args: [
                parseModuleTypeId(type),
                getAddress(address),
                context ?? deInitData
            ]
        })
    }))
}
