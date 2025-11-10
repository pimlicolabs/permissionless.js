import { type Address, concat, getContract, parseEther } from "viem"
import {
    constants,
    getSingletonPaymaster06Address,
    getSingletonPaymaster06InitCode,
    getSingletonPaymaster07Address,
    getSingletonPaymaster07InitCode,
    getSingletonPaymaster08Address,
    getSingletonPaymaster08InitCode
} from "./constants.js"
import {
    singletonPaymaster06Abi,
    singletonPaymaster07Abi,
    singletonPaymaster08Abi
} from "./helpers/abi.js"
import {
    erc20Address,
    erc20Bytecode,
    create2Salt,
    getPaymasterUtilityWallet
} from "./helpers/erc20-utils.js"
import { getPublicClient } from "./helpers/utils.js"

export const deployPaymasters = async ({
    anvilRpc,
    paymasterSigner
}: {
    anvilRpc: string
    paymasterSigner: Address
}) => {
    const walletClient = await getPaymasterUtilityWallet(anvilRpc)
    const publicClient = await getPublicClient(anvilRpc)

    let nonce = await publicClient.getTransactionCount({
        address: walletClient.account.address
    })

    const paymaster06Address = getSingletonPaymaster06Address(paymasterSigner)
    const paymaster07Address = getSingletonPaymaster07Address(paymasterSigner)
    const paymaster08Address = getSingletonPaymaster08Address(paymasterSigner)

    // Deploy singleton paymaster 06 if not already deployed.
    const paymaster06Code = await publicClient.getCode({
        address: paymaster06Address
    })
    if (!paymaster06Code) {
        const hash = await walletClient.sendTransaction({
            to: constants.deterministicDeployer,
            data: concat([
                constants.create2Salt,
                getSingletonPaymaster06InitCode(paymasterSigner)
            ]),
            nonce: nonce++
        })
        await publicClient.waitForTransactionReceipt({ hash })
    }

    // Deploy singleton paymaster 07 if not already deployed.
    const paymaster07Code = await publicClient.getCode({
        address: paymaster07Address
    })
    if (!paymaster07Code) {
        const hash = await walletClient.sendTransaction({
            to: constants.deterministicDeployer,
            data: concat([
                constants.create2Salt,
                getSingletonPaymaster07InitCode(paymasterSigner)
            ]),
            nonce: nonce++
        })
        await publicClient.waitForTransactionReceipt({ hash })
    }

    // Deploy singleton paymaster 08 if not already deployed.
    const paymaster08Code = await publicClient.getCode({
        address: paymaster08Address
    })
    if (!paymaster08Code) {
        const hash = await walletClient.sendTransaction({
            to: constants.deterministicDeployer,
            data: concat([
                constants.create2Salt,
                getSingletonPaymaster08InitCode(paymasterSigner)
            ]),
            nonce: nonce++
        })
        await publicClient.waitForTransactionReceipt({ hash })
    }

    const depositAmount = parseEther("50")

    // Initialize contract instances and fund if needed.
    // Only check deposit balance if the contract was already deployed.

    // Fund paymaster 06 if balance is less than deposit amount.
    const singletonPaymaster06 = getContract({
        address: paymaster06Address,
        abi: singletonPaymaster06Abi,
        client: walletClient
    })
    const deposit06 = await singletonPaymaster06.read.getDeposit()
    if (deposit06 < depositAmount) {
        await singletonPaymaster06.write.deposit({
            value: depositAmount,
            nonce: nonce++
        })
    }

    // Fund paymaster 07 if balance is less than deposit amount.
    const singletonPaymaster07 = getContract({
        address: paymaster07Address,
        abi: singletonPaymaster07Abi,
        client: walletClient
    })
    const deposit07 = await singletonPaymaster07.read.getDeposit()
    if (deposit07 < depositAmount) {
        await singletonPaymaster07.write.deposit({
            value: depositAmount,
            nonce: nonce++
        })
    }

    // Fund paymaster 08 if balance is less than deposit amount.
    const singletonPaymaster08 = getContract({
        address: paymaster08Address,
        abi: singletonPaymaster08Abi,
        client: walletClient
    })
    const deposit08 = await singletonPaymaster08.read.getDeposit()
    if (deposit08 < depositAmount) {
        await singletonPaymaster08.write.deposit({
            value: depositAmount,
            nonce: nonce++
        })
    }
}

export const deployErc20Token = async (anvilRpc: string) => {
    const publicClient = await getPublicClient(anvilRpc)

    if ((await publicClient.getCode({ address: erc20Address })) === undefined) {
        const walletClient = await getPaymasterUtilityWallet(anvilRpc)

        await walletClient.sendTransaction({
            to: "0x4e59b44847b379578588920ca78fbf26c0b4956c",
            data: concat([create2Salt, erc20Bytecode])
        })
    }
}

export const setup = async ({
    anvilRpc,
    paymasterSigner
}: {
    anvilRpc: string
    paymasterSigner: Address
}) => {
    await deployPaymasters({
        anvilRpc,
        paymasterSigner
    })
    await deployErc20Token(anvilRpc)
}
