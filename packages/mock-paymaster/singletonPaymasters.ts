import {
    http,
    type Account,
    type Address,
    type Chain,
    type GetContractReturnType,
    type Hex,
    type PublicClient,
    type Transport,
    type WalletClient,
    concat,
    createPublicClient,
    encodePacked,
    getContract,
    parseEther,
    toBytes
} from "viem"
import {
    type UserOperation,
    toPackedUserOperation
} from "viem/account-abstraction"
import { foundry } from "viem/chains"
import {
    constants,
    getSingletonPaymaster06Address,
    getSingletonPaymaster06InitCode,
    getSingletonPaymaster07Address,
    getSingletonPaymaster07InitCode,
    getSingletonPaymaster08Address,
    getSingletonPaymaster08InitCode
} from "./constants"
import {
    singletonPaymaster06Abi,
    singletonPaymaster07Abi
} from "./helpers/abi.js"
import { getPublicClient } from "./helpers/utils.js"
import type { PaymasterMode } from "./helpers/utils.js"

export const getDummyPaymasterData = (
    isV6: boolean,
    paymaster: Address,
    paymasterMode: PaymasterMode
): { paymaster: Address; paymasterData: Hex } | { paymasterAndData: Hex } => {
    let encodedDummyData: Hex

    const validUntil = 0
    const validAfter = 0
    const paymasterValidationGasLimit = 1n
    const mode = paymasterMode.mode === "verifying" ? 0 : 1

    const allowAllBundlers = true
    const modeAndAllowBundlers = (mode << 1) | (allowAllBundlers ? 1 : 0)

    if (paymasterMode.mode === "verifying") {
        encodedDummyData = encodePacked(
            [
                "uint8", // mode and allowAllBundler
                "uint48", // validUntil
                "uint48", // validAfter
                "bytes" // signature
            ],
            [
                modeAndAllowBundlers,
                validUntil,
                validAfter,
                constants.dummySignature
            ]
        )
    } else {
        encodedDummyData = encodePacked(
            [
                "uint8", // combined byte (mode and allowAllBundlers)
                "uint8", // constantFeePresent and recipientPresent and preFundPresent (1 byte) - 0000{preFundPresent bit}{recipientPresent bit}{constantFeePresent bit}
                "uint48", // validUntil
                "uint48", // validAfter
                "address", // token address
                "uint128", // postOpGas
                "uint256", // exchangeRate
                "uint128", // paymasterValidationGasLimit
                "address" // treasury
            ],
            [
                modeAndAllowBundlers,
                0,
                validUntil,
                validAfter,
                paymasterMode.token,
                constants.postOpGasOverhead,
                constants.exchangeRate,
                paymasterValidationGasLimit,
                constants.treasury
            ]
        )

        encodedDummyData = encodePacked(
            ["bytes", "bytes"],
            [encodedDummyData, constants.dummySignature]
        )
    }

    if (isV6) {
        return {
            paymasterAndData: concat([paymaster, encodedDummyData])
        }
    }

    return {
        paymaster,
        paymasterData: encodedDummyData
    }
}

export const getPaymasterData = async (
    isV6: boolean,
    paymaster: Address,
    paymasterMode: PaymasterMode
) => {
    let paymasterData: Hex

    const validAfter = 0
    const validUntil = Math.floor(Date.now() / 1000) + constants.validForSeconds

    const mode = 1
    const allowAllBundlers = true
    const modeAndAllowBundlers = (mode << 1) | (allowAllBundlers ? 1 : 0)
    const paymasterValidationGasLimit = 1n

    const constantFeePresent = false
    const recipientPresent = false
    const preFundPresent = false

    const constantFeeAndRecipientAndPreFund =
        ((preFundPresent ? 1 : 0) << 2) |
        ((recipientPresent ? 1 : 0) << 1) |
        (constantFeePresent ? 1 : 0)

    if (paymasterMode.mode === "verifying") {
        paymasterData = encodePacked(
            [
                "uint8", // mode and allowAllBundler
                "uint48", // validUntil
                "uint48" // validAfter
            ],
            [modeAndAllowBundlers, validUntil, validAfter]
        )
    } else {
        paymasterData = encodePacked(
            [
                "uint8", // combined byte (mode and allowAllBundlers)
                "uint8", // constantFeePresent and recipientPresent and preFundPresent (1 byte) - 0000{preFundPresent bit}{recipientPresent bit}{constantFeePresent bit}
                "uint48", // validUntil
                "uint48", // validAfter
                "address", // token address
                "uint128", // postOpGas
                "uint256", // exchangeRate
                "uint128", // paymasterValidationGasLimit
                "address" // treasury
            ],
            [
                modeAndAllowBundlers,
                constantFeeAndRecipientAndPreFund,
                validUntil,
                validAfter,
                paymasterMode.token,
                constants.postOpGasOverhead,
                constants.exchangeRate,
                paymasterValidationGasLimit,
                constants.treasury
            ]
        )
    }

    // get signature
    encodedDummyData = encodePacked(
        ["bytes", "bytes"],
        [encodedDummyData, constants.dummySignature]
    )

    const hash = await this.singletonPaymaster.read.getHash([
        mode,
        toPackedUserOperation(op)
    ])

    const sig = await this.walletClient.signMessage({
        message: { raw: toBytes(hash) }
    })

    return paymasterAndData
}

export class SingletonPaymasterV07 {
    protected anvilRpc: string
    protected walletClient: WalletClient<Transport, Chain, Account>
    public singletonPaymaster: GetContractReturnType<
        typeof singletonPaymaster07Abi,
        {
            public: PublicClient<Transport, Chain>
            wallet: WalletClient<Transport, Chain, Account>
        }
    >

    constructor(
        walletClient: WalletClient<Transport, Chain, Account>,
        anvilRpc: string
    ) {
        this.walletClient = walletClient
        this.singletonPaymaster = getContract({
            address: getSingletonPaymaster07Address(
                walletClient.account.address
            ),
            abi: singletonPaymaster07Abi,
            client: {
                wallet: walletClient,
                public: getPublicClient(anvilRpc)
            }
        })
        this.anvilRpc = anvilRpc
    }

    public getDummyPaymasterData(paymasterMode: PaymasterMode): {
        paymaster: Address
        paymasterData: Hex
    } {
        return getDummyPaymasterData(
            false,
            this.singletonPaymaster.address,
            paymasterMode
        ) as {
            paymaster: Address
            paymasterData: Hex
        }
    }

    async encodePaymasterData(
        op: UserOperation<"0.7">,
        paymasterMode: PaymasterMode
    ) {
        const validAfter = 0
        const validUntil = Math.floor(Date.now() / 1000) + 60_000

        const mode = paymasterMode.mode === "verifying" ? 0 : 1
        op.paymaster = this.singletonPaymaster.address
        op.paymasterData = encodePacked(
            ["uint8", "uint48", "uint48"],
            [mode, validUntil, validAfter]
        )

        // if ERC-20 mode, add extra ERC-20 fields
        if (paymasterMode.mode === "erc20") {
            op.paymasterData = encodePacked(
                ["bytes", "address", "uint128", "uint256"],
                [
                    op.paymasterData,
                    paymasterMode.token,
                    constants.postOpGasOverhead,
                    constants.exchangeRate
                ]
            )
        }

        const hash = await this.singletonPaymaster.read.getHash([
            mode,
            toPackedUserOperation(op)
        ])

        const sig = await this.walletClient.signMessage({
            message: { raw: toBytes(hash) }
        })

        return {
            paymaster: this.singletonPaymaster.address,
            paymasterData: encodePacked(
                ["bytes", "bytes"],
                [op.paymasterData, sig]
            )
        }
    }

    async setup() {
        const owner = this.walletClient.account.address

        const publicClient = createPublicClient({
            transport: http(this.anvilRpc),
            chain: foundry
        })

        await this.walletClient
            .sendTransaction({
                to: constants.deterministicDeployer,
                data: concat([
                    constants.create2Salt,
                    getSingletonPaymaster07InitCode(owner)
                ])
            })
            .then((hash) => publicClient.waitForTransactionReceipt({ hash }))

        const singletonPaymaster = getContract({
            address: getSingletonPaymaster06Address(owner),
            abi: singletonPaymaster07Abi,
            client: this.walletClient
        })

        await singletonPaymaster.write.deposit({
            value: parseEther("50")
        })

        return singletonPaymaster
    }
}

export class SingletonPaymasterV08 extends SingletonPaymasterV07 {
    constructor(
        walletClient: WalletClient<Transport, Chain, Account>,
        anvilRpc: string
    ) {
        super(walletClient, anvilRpc)
        this.singletonPaymaster = getContract({
            address: getSingletonPaymaster08Address(
                walletClient.account.address
            ),
            abi: singletonPaymaster07Abi,
            client: {
                wallet: walletClient,
                public: getPublicClient(anvilRpc)
            }
        })
    }

    async setup() {
        const owner = this.walletClient.account.address

        const publicClient = createPublicClient({
            transport: http(this.anvilRpc),
            chain: foundry
        })

        await this.walletClient
            .sendTransaction({
                to: constants.deterministicDeployer,
                data: concat([
                    constants.create2Salt,
                    getSingletonPaymaster08InitCode(owner)
                ])
            })
            .then((hash) => publicClient.waitForTransactionReceipt({ hash }))

        const singletonPaymaster = getContract({
            address: getSingletonPaymaster08Address(owner),
            abi: singletonPaymaster07Abi,
            client: this.walletClient
        })

        await singletonPaymaster.write.deposit({
            value: parseEther("50")
        })

        return singletonPaymaster
    }
}

export class SingletonPaymasterV06 {
    private walletClient: WalletClient<Transport, Chain, Account>
    public singletonPaymaster: GetContractReturnType<
        typeof singletonPaymaster06Abi,
        {
            public: PublicClient<Transport, Chain>
            wallet: WalletClient<Transport, Chain, Account>
        }
    >
    private anvilRpc: string

    constructor(
        walletClient: WalletClient<Transport, Chain, Account>,
        anvilRpc: string
    ) {
        this.walletClient = walletClient
        this.singletonPaymaster = getContract({
            address: getSingletonPaymaster06Address(
                walletClient.account.address
            ),
            abi: singletonPaymaster06Abi,
            client: {
                wallet: walletClient,
                public: getPublicClient(anvilRpc)
            }
        })
        this.anvilRpc = anvilRpc
    }

    public getDummyPaymasterData(paymasterMode: PaymasterMode): {
        paymasterAndData: Hex
    } {
        return getDummyPaymasterData(
            true,
            this.singletonPaymaster.address,
            paymasterMode
        ) as {
            paymasterAndData: Hex
        }
    }

    async encodePaymasterData(
        op: UserOperation<"0.6">,
        paymasterMode: PaymasterMode
    ) {
        const validAfter = 0
        const validUntil = Math.floor(Date.now() / 1000) + 60_000
        const mode = paymasterMode.mode === "verifying" ? 0 : 1
        op.paymasterAndData = encodePacked(
            ["address", "uint8", "uint48", "uint48"],
            [this.singletonPaymaster.address, mode, validUntil, validAfter]
        )

        if (paymasterMode.mode === "erc20") {
            op.paymasterAndData = encodePacked(
                ["bytes", "address", "uint128", "uint256"],
                [
                    op.paymasterAndData,
                    paymasterMode.token,
                    constants.postOpGasOverhead,
                    constants.exchangeRate
                ]
            )
        }

        const hash = await this.singletonPaymaster.read.getHash([
            mode,
            {
                ...op,
                initCode: op.initCode || "0x",
                paymasterAndData: op.paymasterAndData || "0x"
            }
        ])
        const sig = await this.walletClient.signMessage({
            message: { raw: hash }
        })

        return {
            paymasterAndData: encodePacked(
                ["bytes", "bytes"],
                [op.paymasterAndData, sig]
            )
        }
    }

    async setup() {
        const owner = this.walletClient.account.address

        const publicClient = createPublicClient({
            transport: http(this.anvilRpc),
            chain: foundry
        })

        await this.walletClient
            .sendTransaction({
                to: constants.deterministicDeployer,
                data: concat([
                    constants.create2Salt,
                    getSingletonPaymaster06InitCode(owner)
                ])
            })
            .then((hash) => publicClient.waitForTransactionReceipt({ hash }))

        const singletonPaymaster = getContract({
            address: getSingletonPaymaster06Address(owner),
            abi: singletonPaymaster06Abi,
            client: this.walletClient
        })

        return singletonPaymaster
    }
}
