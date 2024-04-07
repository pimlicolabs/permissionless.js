import { http, createWalletClient } from "viem"
import { mnemonicToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import {
    ENTRY_POINT_SIMULATIONS_CREATE_CALL,
    ENTRY_POINT_V06_CREATE_CALL,
    ENTRY_POINT_V07_CREATE_CALL,
    SIMPLE_ACCOUNT_FACTORY_V06_CREATE_CALL,
    SIMPLE_ACCOUNT_FACTORY_V07_CREATE_CALL
} from "./constants"

const DETERMINISTIC_DEPLOYER = "0x4e59b44847b379578588920ca78fbf26c0b4956c"

const walletClient = createWalletClient({
    account: mnemonicToAccount(
        "test test test test test test test test test test test junk"
    ),
    chain: foundry,
    transport: http(process.env.ANVIL_RPC)
})

const main = async () => {
    console.log("========== DEPLOYING V0.7 RELATED CONTRACTS ==========")

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

    console.log("========== DEPLOYING V0.6 RELATED CONTRACTS ==========")

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
