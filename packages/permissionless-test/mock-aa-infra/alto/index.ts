import {
    http,
    type Address,
    type PublicClient,
    createPublicClient,
    createTestClient,
    createWalletClient,
    parseEther
} from "viem"
import { mnemonicToAccount } from "viem/accounts"
import { sendTransaction } from "viem/actions"
import { foundry } from "viem/chains"
import {
    BICONOMY_ACCOUNT_V2_LOGIC_CREATECALL,
    BICONOMY_DEFAULT_FALLBACK_HANDLER_CREATECALL,
    BICONOMY_ECDSA_OWNERSHIP_REGISTRY_MODULE_CREATECALL,
    BICONOMY_FACTORY_CREATECALL,
    BICONOMY_SINGLETON_FACTORY_BYTECODE,
    ENTRY_POINT_SIMULATIONS_CREATECALL,
    ENTRY_POINT_V06_CREATECALL,
    ENTRY_POINT_V07_CREATECALL,
    ERC_7579_TEST_MODULE_CREATECALL,
    ETHERSPOT_BOOTSTRAP_CREATECALL,
    ETHERSPOT_MULTIPLE_OWNER_ECDSA_VALIDATOR_CREATECALL,
    ETHERSPOT_WALLET_FACTORY_CREATECALL,
    KERNEL_V06_ACCOUNT_V2_2_LOGIC_CREATECALL,
    KERNEL_V06_ECDSA_VALIDATOR_V2_2_CREATECALL,
    KERNEL_V06_FACTORY_CREATECALL,
    KERNEL_V07_ACCOUNT_V3_LOGIC_CREATECALL,
    KERNEL_V07_ECDSA_VALIDATOR_V3_CREATECALL,
    KERNEL_V07_FACTORY_CREATECALL,
    KERNEL_V07_META_FACTORY_CREATECALL,
    KERNEL_V07_V3_1_ACCOUNT_V3_LOGIC_CREATECALL,
    KERNEL_V07_V3_1_ECDSA_VALIDATOR_V3_CREATECALL,
    KERNEL_V07_V3_1_FACTORY_CREATECALL,
    LIGHT_ACCOUNT_FACTORY_V110_CREATECALL,
    SAFE_7579_LAUNCHPAD_CREATECALL,
    SAFE_7579_MODULE_CREATECALL,
    SAFE_7579_REGISTRY_CREATECALL,
    SAFE_MULTI_SEND_CALL_ONLY_CREATECALL,
    SAFE_MULTI_SEND_CREATECALL,
    SAFE_PROXY_FACTORY_CREATECALL,
    SAFE_SINGLETON_CREATECALL,
    SAFE_SINGLETON_FACTORY_BYTECODE,
    SAFE_V06_MODULE_CREATECALL,
    SAFE_V06_MODULE_SETUP_CREATECALL,
    SAFE_V07_MODULE_CREATECALL,
    SAFE_V07_MODULE_SETUP_CREATECALL,
    SIMPLE_ACCOUNT_FACTORY_V06_CREATECALL,
    SIMPLE_ACCOUNT_FACTORY_V07_CREATECALL,
    TRUST_ACCOUNT_FACET_CREATE_CALL,
    TRUST_DEFAULT_FALLBACK_HANDLER,
    TRUST_DIAMOND_CUT_FACET_CREATE_CALL,
    TRUST_DIAMOND_LOUPE_FACET_CREATE_CALL,
    TRUST_FACTORY_V06_CREATECALL,
    TRUST_SECP256K1_VERIFICATION_FACET_CREATECALL,
    TRUST_TOKEN_RECEIVER_FACET_CREATE_CALL
} from "./constants"

const DETERMINISTIC_DEPLOYER = "0x4e59b44847b379578588920ca78fbf26c0b4956c"
const SAFE_SINGLETON_FACTORY = "0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7"
const BICONOMY_SINGLETON_FACTORY = "0x988C135a1049Ce61730724afD342fb7C56CD2776"
export const ENTRY_POINT_SIMULATIONS_ADDRESS =
    "0x74Cb5e4eE81b86e70f9045036a1C5477de69eE87"

const verifyDeployed = async (client: PublicClient, addresses: Address[]) => {
    for (const address of addresses) {
        const bytecode = await client.getBytecode({
            address
        })

        if (bytecode === undefined) {
            console.log(`CONTRACT ${address} NOT DEPLOYED!!!`)
            process.exit(1)
        }
    }
}

export const setupContracts = async (rpc: string) => {
    const walletClient = createWalletClient({
        account: mnemonicToAccount(
            "test test test test test test test test test test test junk"
        ),
        chain: foundry,
        transport: http(rpc)
    })

    const anvilClient = createTestClient({
        transport: http(rpc),
        mode: "anvil"
    })

    const client = createPublicClient({
        transport: http(rpc)
    })

    let nonce = await client.getTransactionCount({
        address: walletClient.account.address
    })

    await Promise.all([
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ENTRY_POINT_V07_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SIMPLE_ACCOUNT_FACTORY_V07_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ENTRY_POINT_SIMULATIONS_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ENTRY_POINT_V06_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SIMPLE_ACCOUNT_FACTORY_V06_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SAFE_V06_MODULE_SETUP_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SAFE_V06_MODULE_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SAFE_V07_MODULE_SETUP_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SAFE_7579_MODULE_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SAFE_7579_REGISTRY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SAFE_7579_LAUNCHPAD_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SAFE_V07_MODULE_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V06_ECDSA_VALIDATOR_V2_2_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V06_ACCOUNT_V2_2_LOGIC_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V06_FACTORY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V07_FACTORY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V07_ECDSA_VALIDATOR_V3_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V07_ACCOUNT_V3_LOGIC_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V07_META_FACTORY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V07_V3_1_FACTORY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V07_V3_1_ECDSA_VALIDATOR_V3_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V07_V3_1_ACCOUNT_V3_LOGIC_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: LIGHT_ACCOUNT_FACTORY_V110_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: TRUST_FACTORY_V06_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: TRUST_SECP256K1_VERIFICATION_FACET_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: TRUST_ACCOUNT_FACET_CREATE_CALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: TRUST_DIAMOND_CUT_FACET_CREATE_CALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: TRUST_TOKEN_RECEIVER_FACET_CREATE_CALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: TRUST_DIAMOND_LOUPE_FACET_CREATE_CALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: TRUST_DEFAULT_FALLBACK_HANDLER,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ERC_7579_TEST_MODULE_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ETHERSPOT_WALLET_FACTORY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ETHERSPOT_BOOTSTRAP_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ETHERSPOT_MULTIPLE_OWNER_ECDSA_VALIDATOR_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        })
    ])

    await anvilClient.setCode({
        address: SAFE_SINGLETON_FACTORY,
        bytecode: SAFE_SINGLETON_FACTORY_BYTECODE
    })

    await Promise.all([
        walletClient.sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_PROXY_FACTORY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_SINGLETON_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_MULTI_SEND_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_MULTI_SEND_CALL_ONLY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        })
    ])

    await anvilClient.setCode({
        address: BICONOMY_SINGLETON_FACTORY,
        bytecode: BICONOMY_SINGLETON_FACTORY_BYTECODE
    })

    await Promise.all([
        walletClient.sendTransaction({
            to: BICONOMY_SINGLETON_FACTORY,
            data: BICONOMY_ECDSA_OWNERSHIP_REGISTRY_MODULE_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),

        walletClient.sendTransaction({
            to: BICONOMY_SINGLETON_FACTORY,
            data: BICONOMY_ACCOUNT_V2_LOGIC_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),

        walletClient.sendTransaction({
            to: BICONOMY_SINGLETON_FACTORY,
            data: BICONOMY_FACTORY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),

        walletClient.sendTransaction({
            to: BICONOMY_SINGLETON_FACTORY,
            data: BICONOMY_DEFAULT_FALLBACK_HANDLER_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        })
    ])

    // ==== SETUP KERNEL V0.6 CONTRACTS ==== //
    const kernelFactoryOwner = "0x9775137314fE595c943712B0b336327dfa80aE8A"
    await anvilClient.setBalance({
        address: kernelFactoryOwner,
        value: parseEther("100")
    })

    await anvilClient.impersonateAccount({
        address: kernelFactoryOwner
    })

    // register 0x0DA6a956B9488eD4dd761E59f52FDc6c8068E6B5
    await sendTransaction(walletClient, {
        account: kernelFactoryOwner,
        to: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3" /* kernel factory v0.6 */,
        data: "0xbb30a9740000000000000000000000000da6a956b9488ed4dd761e59f52fdc6c8068e6b50000000000000000000000000000000000000000000000000000000000000001" /* setImplementation(address _implementation,bool _allow) */
    })

    // register 0x6723b44Abeec4E71eBE3232BD5B455805baDD22f
    await sendTransaction(walletClient, {
        account: kernelFactoryOwner,
        to: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5" /* kernel factory v0.7 */,
        data: "0x6e7dbabb0000000000000000000000006723b44abeec4e71ebe3232bd5b455805badd22f0000000000000000000000000000000000000000000000000000000000000001"
    })

    // register 0xaac5D4240AF87249B3f71BC8E4A2cae074A3E419
    await sendTransaction(walletClient, {
        account: kernelFactoryOwner,
        to: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5" /* kernel factory v0.7 */,
        data: "0x6e7dbabb000000000000000000000000aac5D4240AF87249B3f71BC8E4A2cae074A3E4190000000000000000000000000000000000000000000000000000000000000001"
    })

    await sendTransaction(walletClient, {
        account: kernelFactoryOwner,
        to: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5" /* kernel factory v0.7 */,
        data: "0xc7e55f3e0000000000000000000000000000000071727de22e5e9d8baf0edac6f37da0320000000000000000000000000000000000000000000000000000000000015180"
    })

    await anvilClient.stopImpersonatingAccount({
        address: kernelFactoryOwner
    })

    // ==== SETUP ALCHEMY LIGHT ACCOUNT CONTRACTS ==== //
    const alchemyLightClientOwner = "0xDdF32240B4ca3184De7EC8f0D5Aba27dEc8B7A5C"
    await anvilClient.setBalance({
        address: alchemyLightClientOwner,
        value: parseEther("100")
    })

    await anvilClient.impersonateAccount({
        address: alchemyLightClientOwner
    })

    await sendTransaction(walletClient, {
        account: alchemyLightClientOwner,
        to: "0x0000000000400CdFef5E2714E63d8040b700BC24" /* light account v2.0.0 factory */,
        data: "0xfbb1c3d40000000000000000000000000000000000000000000000000000000000015180000000000000000000000000000000000000000000000000016345785d8a0000",
        value: parseEther("0.1")
    })

    await anvilClient.stopImpersonatingAccount({
        address: alchemyLightClientOwner
    })

    await verifyDeployed(client, [
        "0x4e59b44847b379578588920ca78fbf26c0b4956c", // Determinstic deployer
        "0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7", // Safe Singleton Factory
        "0x988C135a1049Ce61730724afD342fb7C56CD2776", // Biconomy Singleton Factory
        "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // EntryPoint v0.7
        "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985", // Simple Account Factory V0.7
        ENTRY_POINT_SIMULATIONS_ADDRESS, // EntryPoint Simulations (Needed for v0.7)
        "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47", // Safe V0.7 Module Setup
        "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226", // Safe V0.7 4337 Module
        "0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb", // Safe V0.6 Module Setup
        "0xa581c4A4DB7175302464fF3C06380BC3270b4037", // Safe V0.6 4337 Module
        "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67", // Safe Proxy Factory
        "0x41675C099F32341bf84BFc5382aF534df5C7461a", // Safe Singleton
        "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526", // Safe Multi Send
        "0x9641d764fc13c8B624c04430C7356C1C7C8102e2", // Safe Multi Send Call Only
        "0x3Fdb5BC686e861480ef99A6E3FaAe03c0b9F32e2", // Safe 7579 module
        "0xEBe001b3D534B9B6E2500FB78E67a1A137f561CE", // Safe 7579 launchpad
        "0x25A4b2F363678E13A0A5DB79b712dE00347a593E", // Safe 7579 Registry
        "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // EntryPoint V0.6
        "0x9406Cc6185a346906296840746125a0E44976454", // Simple Account Factory V0.6
        "0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e", // Biconomy ECDSA Ownership Registry Module
        "0x0000002512019Dafb59528B82CB92D3c5D2423ac", // Biconomy Account Logic V0.2
        "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5", // Biconomy Factory Address
        "0x0bBa6d96BD616BedC6BFaa341742FD43c60b83C1", // Biconomy Default Fallback Handler
        "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390", // Kernel v0.2.2 ECDSA Valdiator
        "0x0DA6a956B9488eD4dd761E59f52FDc6c8068E6B5", // Kernel v0.2.2 Account Logic
        "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3", // Kernel v0.2.2 Factory
        "0x8104e3Ad430EA6d354d013A6789fDFc71E671c43", // Kernel v0.3.0 ECDSA Valdiator
        "0x94F097E1ebEB4ecA3AAE54cabb08905B239A7D27", // Kernel v0.3.0 Account Logic
        "0x6723b44Abeec4E71eBE3232BD5B455805baDD22f", // Kernel v0.3.0 Factory
        "0xd703aaE79538628d27099B8c4f621bE4CCd142d5", // Kernel v0.3.0 & v0.3.1 Meta Factory
        "0x845ADb2C711129d4f3966735eD98a9F09fC4cE57", // Kernel v0.3.1 ECDSA Valdiator
        "0xBAC849bB641841b44E965fB01A4Bf5F074f84b4D", // Kernel v0.3.1 Account Logic
        "0xaac5D4240AF87249B3f71BC8E4A2cae074A3E419", // Kernel v0.3.1 Factory
        "0x00004EC70002a32400f8ae005A26081065620D20", // LightAccountFactory v1.1.0
        "0xae8c656ad28F2B59a196AB61815C16A0AE1c3cba", // LightAccount v1.1.0 implementation
        "0x81b9E3689390C7e74cF526594A105Dea21a8cdD5", // Trust Secp256k1VerificationFacet
        "0x729c310186a57833f622630a16d13f710b83272a", // Trust factory
        "0xFde53272dcd7938d16E031A6989753c321728332", // Trust AccountFacet
        "0x0B9504140771C3688Ff041917192277D2f52E1e0", // Trust DiamondCutFacet
        "0x3143E1C0Af0Cdc153423863923Cf4e3818e34Daa", // Trust TokenReceiverFacet
        "0xCe36b85d12D81cd619C745c7717f3396E184Ac7C", // Trust DiamondLoupeFacet
        "0x2e7f1dAe1F3799d20f5c31bEFdc7A620f664728D", // Trust DefaultFallbackHandler
        "0xc98B026383885F41d9a995f85FC480E9bb8bB891", // ERC7579 Test Module
        "0x93FB56A4a0B7160fbf8903d251Cc7A3fb9bA0933", // Etherspot Factory
        "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066", // Etherspot Bootstrap
        "0x8c4496Ba340aFe5ac4148cfEA9ccbBCD54093143" // Etherspot Multiple Owner ECDSA Validator
    ])
}
