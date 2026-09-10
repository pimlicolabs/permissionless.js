import type { SmartAccount } from "viem/erc4337"
import { AbiFunction, Address, type Hex } from "viem/utils"
import {
    type ModuleType,
    parseModuleTypeId
} from "../actions/erc7579/supportsModule.js"
import { AccountNotFoundError } from "../errors/index.js"
import type { GetSmartAccountParameter, OneOf } from "../types/utils.js"

export type EncodeUninstallModuleParameter = {
    type: ModuleType
    address: Address.Address
} & OneOf<
    | {
          context: Hex.Hex
      }
    | {
          deInitData: Hex.Hex
      }
>

export type EncodeUninstallModuleParameters<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
> = GetSmartAccountParameter<TSmartAccount> & {
    modules: EncodeUninstallModuleParameter[] | EncodeUninstallModuleParameter
}

const uninstallModuleAbi = [
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
] as const

export function encodeUninstallModule<
    TSmartAccount extends SmartAccount.SmartAccount | undefined
>(parameters: EncodeUninstallModuleParameters<TSmartAccount>) {
    const account = parameters.account as SmartAccount.SmartAccount

    if (!account) {
        throw new AccountNotFoundError()
    }

    const modules = Array.isArray(parameters.modules)
        ? parameters.modules
        : [parameters.modules]

    return modules.map(({ type, address, context, deInitData }) => ({
        to: account.address,
        value: BigInt(0),
        data: AbiFunction.encodeData(uninstallModuleAbi, "uninstallModule", [
            parseModuleTypeId(type),
            Address.checksum(address),
            (context ?? deInitData) as Hex.Hex
        ])
    }))
}
