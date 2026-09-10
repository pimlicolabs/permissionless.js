import type { SmartAccount } from "viem/erc4337"
import { AbiFunction, Address, type Hex } from "viem/utils"
import {
    type ModuleType,
    parseModuleTypeId
} from "../actions/erc7579/supportsModule.js"
import { AccountNotFoundError } from "../errors/index.js"
import type { GetSmartAccountParameter, OneOf } from "../types/utils.js"

export type EncodeInstallModuleParameter = {
    type: ModuleType
    address: Address.Address
} & OneOf<
    | {
          context: Hex.Hex
      }
    | {
          initData: Hex.Hex
      }
>

export type EncodeInstallModuleParameters<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    modules: EncodeInstallModuleParameter[] | EncodeInstallModuleParameter
}

const installModuleAbi = [
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
] as const

export function encodeInstallModule<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
>(parameters: EncodeInstallModuleParameters<TSmartAccount>) {
    const account = parameters.account as SmartAccount.SmartAccount

    if (!account) {
        throw new AccountNotFoundError()
    }

    const modules = Array.isArray(parameters.modules)
        ? parameters.modules
        : [parameters.modules]

    return modules.map(
        ({ type, address, context, initData }) =>
            ({
                to: account.address,
                value: BigInt(0),
                data: AbiFunction.encodeData(
                    installModuleAbi,
                    "installModule",
                    [
                        parseModuleTypeId(type),
                        Address.checksum(address),
                        (context ?? initData) as Hex.Hex
                    ]
                )
            }) as const
    )
}
