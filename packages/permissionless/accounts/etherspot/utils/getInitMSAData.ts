import { type Address, type Hex, encodeFunctionData, zeroAddress } from "viem"
import {
    EtherspotBootstrapAbi,
    EtherspotOnInstallAbi
} from "../abi/EtherspotBootstrapAbi.js"

export const getInitMSAData = (ecdsaValidatorAddress: Address) => {
    const validators = makeBootstrapConfig(ecdsaValidatorAddress, "0x")
    const executors = makeBootstrapConfig(zeroAddress, "0x")
    const hook = _makeBootstrapConfig(zeroAddress, "0x")
    const fallbacks = makeBootstrapConfig(zeroAddress, "0x")
    const initMSAData = encodeFunctionData({
        abi: EtherspotBootstrapAbi,
        functionName: "initMSA",
        args: [validators, executors, hook, fallbacks]
    })

    return initMSAData
}

const _makeBootstrapConfig = (module: string, data: string) => {
    const config = {
        module: "",
        data: ""
    }

    config.module = module

    config.data = encodeFunctionData({
        abi: EtherspotOnInstallAbi,
        functionName: "onInstall",
        args: [data as Hex]
    })

    return config
}

const makeBootstrapConfig = (module: string, data: string) => {
    const config: {
        module: string
        data: Hex
    }[] = []

    const data1 = encodeFunctionData({
        abi: EtherspotOnInstallAbi,
        functionName: "onInstall",
        args: [data as Hex]
    })

    const newConfig = {
        module: module,
        data: data1
    }
    config.push(newConfig)
    return config
}
