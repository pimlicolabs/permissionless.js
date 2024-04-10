import { http, createWalletClient, createTestClient } from "viem"
import { mnemonicToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import {
    ENTRY_POINT_SIMULATIONS_CREATE_CALL,
    ENTRY_POINT_V06_CREATE_CALL,
    ENTRY_POINT_V07_CREATE_CALL,
    MULTI_SEND_CREATE_CALL,
    SAFE_4337_MODULE_CREATE_CALL,
    SAFE_MODULE_SETUP_CREATE_CALL,
    SAFE_PROXY_FACTORY_CREATE_CALL,
    SAFE_SINGLETON_CREATE_CALL,
    SAFE_SINGLETON_FACTORY_BYTECODE,
    SIMPLE_ACCOUNT_FACTORY_V06_CREATE_CALL,
    SIMPLE_ACCOUNT_FACTORY_V07_CREATE_CALL
} from "./constants"

const DETERMINISTIC_DEPLOYER = "0x4e59b44847b379578588920ca78fbf26c0b4956c"
const SAFE_SINGLETON_FACTORY = "0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7"

const walletClient = createWalletClient({
    account: mnemonicToAccount(
        "test test test test test test test test test test test junk"
    ),
    chain: foundry,
    transport: http(process.env.ANVIL_RPC)
})

const anvilClient = createTestClient({
    transport: http(process.env.ANVIL_RPC),
    mode: "anvil"
})

const main = async () => {
    console.log("========== DEPLOYING V0.7 CORE CONTRACTS ==========")

    await walletClient
        .sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ENTRY_POINT_V07_CREATE_CALL
        })
        .then(() => console.log("Deployed EntryPoint V0.7"))

    await walletClient
        .sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SIMPLE_ACCOUNT_FACTORY_V07_CREATE_CALL
        })
        .then(() => console.log("Deployed SimpleAccountFactory v0.7"))

    await walletClient
        .sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ENTRY_POINT_SIMULATIONS_CREATE_CALL
        })
        .then(() => console.log("Deployed EntryPointSimulations"))

    console.log("========== DEPLOYING V0.7 SAFE CONTRACTS ==========")

    await walletClient
        .sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SAFE_MODULE_SETUP_CREATE_CALL
        })
        .then(() => console.log("Deployed Safe Module Setup"))

    await walletClient
        .sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SAFE_4337_MODULE_CREATE_CALL
        })
        .then(() => console.log("Deployed Safe 4337 Module"))

    await anvilClient
        .setCode({
            address: SAFE_SINGLETON_FACTORY,
            bytecode: SAFE_SINGLETON_FACTORY_BYTECODE
        })
        .then(() => console.log("Etched Safe Singleton Factory Bytecode"))

    await walletClient
        .sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_PROXY_FACTORY_CREATE_CALL
        })
        .then(() => console.log("Deployed Safe Proxy Factory"))

    await walletClient
        .sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_SINGLETON_CREATE_CALL
        })
        .then(() => console.log("Deployed Safe Singleton"))

    await walletClient
        .sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: MULTI_SEND_CREATE_CALL
        })
        .then(() => console.log("Deployed Safe Multi Send Create"))

    console.log("========== DEPLOYING V0.6 CORE CONTRACTS ==========")

    await walletClient
        .sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ENTRY_POINT_V06_CREATE_CALL
        })
        .then(() => console.log("Deployed EntryPoint v0.6"))

    await walletClient
        .sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SIMPLE_ACCOUNT_FACTORY_V06_CREATE_CALL
        })
        .then(() => console.log("Deployed SimpleAccountFactory v0.6"))
}

main()
