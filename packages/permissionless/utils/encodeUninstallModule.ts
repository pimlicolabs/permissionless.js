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
                    type: "function",
                    name: "uninstallModule",
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
                            name: "deInitData",
                            type: "bytes",
                            internalType: "bytes"
                        }
                    ],
                    outputs: [],
                    stateMutability: "nonpayable"
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
