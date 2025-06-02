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
    ENTRY_POINT_V06_CREATECALL,
    ENTRY_POINT_V07_CREATECALL,
    ENTRY_POINT_V08_CREATECALL,
    ERC_7579_TEST_MODULE_CREATECALL,
    ETHERSPOT_BOOTSTRAP_CREATECALL,
    ETHERSPOT_IMPLEMENTATION,
    ETHERSPOT_MULTIPLE_OWNER_ECDSA_VALIDATOR_CREATECALL,
    ETHERSPOT_WALLET_FACTORY_CREATECALL,
    KERNEL_V06_ACCOUNT_V2_1_LOGIC_CREATECALL,
    KERNEL_V06_ACCOUNT_V2_2_LOGIC_CREATECALL,
    KERNEL_V06_ACCOUNT_V2_3_LOGIC_CREATECALL,
    KERNEL_V06_ACCOUNT_V2_4_LOGIC_CREATECALL,
    KERNEL_V06_ECDSA_VALIDATOR_V2_2_CREATECALL,
    KERNEL_V06_FACTORY_CREATECALL,
    KERNEL_V07_ACCOUNT_V3_LOGIC_CREATECALL,
    KERNEL_V07_ECDSA_VALIDATOR_V3_CREATECALL,
    KERNEL_V07_FACTORY_CREATECALL,
    KERNEL_V07_META_FACTORY_CREATECALL,
    KERNEL_V07_V3_1_ACCOUNT_V3_LOGIC_CREATECALL,
    KERNEL_V07_V3_1_ECDSA_VALIDATOR_V3_CREATECALL,
    KERNEL_V07_V3_1_FACTORY_CREATECALL,
    KERNEL_V07_V3_1_WEB_AUTHN_VALIDATOR_CREATECALL,
    KERNEL_V07_V3_2_ACCOUNT_V3_LOGIC_CREATECALL,
    KERNEL_V07_V3_2_FACTORY_CREATECALL,
    KERNEL_V07_V3_3_ACCOUNT_V3_LOGIC_CREATECALL,
    KERNEL_V07_V3_3_FACTORY_CREATECALL,
    LIGHT_ACCOUNT_FACTORY_V110_CREATECALL,
    LIGHT_ACCOUNT_FACTORY_V200_CREATECALL,
    NEXUS_ACCOUNT_BOOTSTRAPPER_CREATECALL,
    NEXUS_ACCOUNT_IMPLEMENTATION_CREATECALL,
    NEXUS_BOOTSTRAP_LIB_CREATECALL,
    NEXUS_K1_VALIDATOR_CREATECALL,
    NEXUS_K1_VALIDATOR_FACTORY_CREATECALL,
    SAFE_7579_LAUNCHPAD_CREATECALL,
    SAFE_7579_MODULE_CREATECALL,
    SAFE_7579_REGISTRY_CREATECALL,
    SAFE_7579_REGISTRY_RESOLVER_CREATECALL,
    SAFE_7579_REGISTRY_RESOLVER_PROXY_CREATECALL,
    SAFE_7579_REGISTRY_SCHEMA_CREATECALL,
    SAFE_7579_REGISTRY_SCHEMA_PROXY_CREATECALL,
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
    SIMPLE_ACCOUNT_FACTORY_V08_CREATECALL,
    THIRDWEB_FACTORY_V06_CREATECALL,
    THIRDWEB_FACTORY_V07_CREATECALL,
    TRUST_ACCOUNT_FACET_CREATE_CALL,
    TRUST_DEFAULT_FALLBACK_HANDLER,
    TRUST_DIAMOND_CUT_FACET_CREATE_CALL,
    TRUST_DIAMOND_LOUPE_FACET_CREATE_CALL,
    TRUST_FACTORY_V06_CREATECALL,
    TRUST_SECP256K1_VERIFICATION_FACET_CREATECALL,
    TRUST_TOKEN_RECEIVER_FACET_CREATE_CALL
} from "./constants/index"

const DETERMINISTIC_DEPLOYER = "0x4e59b44847b379578588920ca78fbf26c0b4956c"
const SAFE_SINGLETON_FACTORY = "0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7"
const BICONOMY_SINGLETON_FACTORY = "0x988C135a1049Ce61730724afD342fb7C56CD2776"
const SAFE_7579_REGISTRY = "0x000000000069E2a187AEFFb852bF3cCdC95151B2"

const verifyDeployed = async (client: PublicClient, addresses: Address[]) => {
    for (const address of addresses) {
        const bytecode = await client.getCode({
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

    await anvilClient.setCode({
        address: SAFE_SINGLETON_FACTORY,
        bytecode: SAFE_SINGLETON_FACTORY_BYTECODE
    })

    await Promise.all([
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ENTRY_POINT_V08_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: SIMPLE_ACCOUNT_FACTORY_V08_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
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
            data: SAFE_V07_MODULE_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_7579_REGISTRY_CREATECALL,
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
            data: KERNEL_V06_ACCOUNT_V2_3_LOGIC_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V06_ACCOUNT_V2_4_LOGIC_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V06_ACCOUNT_V2_1_LOGIC_CREATECALL,
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
            data: KERNEL_V07_V3_1_WEB_AUTHN_VALIDATOR_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V07_V3_2_ACCOUNT_V3_LOGIC_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V07_V3_2_FACTORY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V07_V3_3_ACCOUNT_V3_LOGIC_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: KERNEL_V07_V3_3_FACTORY_CREATECALL,
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
            data: LIGHT_ACCOUNT_FACTORY_V200_CREATECALL,
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
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_7579_REGISTRY_SCHEMA_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_7579_REGISTRY_RESOLVER_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_7579_REGISTRY_SCHEMA_PROXY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_7579_REGISTRY_RESOLVER_PROXY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: THIRDWEB_FACTORY_V06_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: THIRDWEB_FACTORY_V07_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: NEXUS_BOOTSTRAP_LIB_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        })
    ])

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
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ETHERSPOT_WALLET_FACTORY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data: ETHERSPOT_IMPLEMENTATION,
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
        }),
        walletClient.sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_7579_MODULE_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: SAFE_SINGLETON_FACTORY,
            data: SAFE_7579_LAUNCHPAD_CREATECALL,
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
        }),
        walletClient.sendTransaction({
            to: BICONOMY_SINGLETON_FACTORY,
            data: NEXUS_K1_VALIDATOR_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: BICONOMY_SINGLETON_FACTORY,
            data: NEXUS_K1_VALIDATOR_FACTORY_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: BICONOMY_SINGLETON_FACTORY,
            data: NEXUS_ACCOUNT_IMPLEMENTATION_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        }),
        walletClient.sendTransaction({
            to: BICONOMY_SINGLETON_FACTORY,
            data: NEXUS_ACCOUNT_BOOTSTRAPPER_CREATECALL,
            gas: 15_000_000n,
            nonce: nonce++
        })
    ])

    const rhinestoneAttester = "0x000000333034E9f539ce08819E12c1b8Cb29084d"
    await anvilClient.setBalance({
        address: rhinestoneAttester,
        value: parseEther("100")
    })

    await anvilClient.impersonateAccount({
        address: rhinestoneAttester
    })

    // register schema
    await sendTransaction(walletClient, {
        account: rhinestoneAttester,
        to: SAFE_7579_REGISTRY,
        data: "0x1d4d9810000000000000000000000000000000000000000000000000000000000000004000000000000000000000000086430e19d7d204807bbb8cda997bb57b7ee785dd000000000000000000000000000000000000000000000000000000000000024628656e756d20455243373537394d6f64756c655479706520284e6f6e652c56616c696461746f722c4578656375746f722c46616c6c6261636b2c486f6f6b292c737472756374204d6f64756c6554797065417474726962757465732028455243373537394d6f64756c6554797065206d6f64756c65547970652c627974657320656e636f64656441747472696275746573292c737472756374204d6f64756c6541747472696275746573202861646472657373206d6f64756c65416464726573732c6279746573207061636b6564417474726962757465732c4d6f64756c6554797065417474726962757465735b5d2074797065417474726962757465732c6279746573207061636b656445787465726e616c446570656e64656e6379292c656e756d205369676e61747572655479706520284e6f6e652c534543503235364b312c45524331323731292c7374727563742041756469746f722028737472696e67206e616d652c737472696e67207572692c737472696e675b5d20617574686f7273292c737472756374205369676e617475726520285369676e61747572655479706520736967547970652c61646472657373207369676e65722c6279746573207369676e6174757265446174612c627974657333322068617368292c73747275637420417564697453756d6d6172792028737472696e67207469746c652c41756469746f722061756469746f722c4d6f64756c6541747472696275746573206d6f64756c65417474726962757465732c5369676e6174757265207369676e617475726529290000000000000000000000000000000000000000000000000000"
    })

    // regsiter resolver
    await sendTransaction(walletClient, {
        account: rhinestoneAttester,
        to: SAFE_7579_REGISTRY,
        data: "0x9f3e1b53000000000000000000000000f0f468571e764664c93308504642af941d9f77f1"
    })

    await anvilClient.stopImpersonatingAccount({
        address: rhinestoneAttester
    })

    // deploy module
    await sendTransaction(walletClient, {
        to: SAFE_7579_REGISTRY,
        data: ERC_7579_TEST_MODULE_CREATECALL
    })

    await anvilClient.impersonateAccount({
        address: rhinestoneAttester
    })

    // attest to module
    await sendTransaction(walletClient, {
        account: rhinestoneAttester,
        to: SAFE_7579_REGISTRY,
        data: "0x945e364193d46fcca4ef7d66a413c7bde08bb1ff14bacbd04c4069bb24cd7c21729d7bf100000000000000000000000000000000000000000000000000000000000000400000000000000000000000004fd8d57b94966982b62e9588c27b4171b55e835400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000094000000000000000000000000000000000000000000000000000000000000008a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000003a0000000000000000000000000000000000000000000000000000000000000078000000000000000000000000000000000000000000000000000000000000000104f776e61626c6556616c696461746f7200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000001041636b656520426c6f636b636861696e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001168747470733a2f2f61636b65652e78797a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000012c5a074c49b70c3a16e20c5a06f6e736bc3bd000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000124d696368616c2050c599657672c3a174696c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d4e616f6b6920596f736869646100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f4a616e2050c599657672c3a174696c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000184a6f736566204761747465726d617965722c2050682e442e00000000000000000000000000000000000000004fd8d57b94966982b62e9588c27b4171b55e835400000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000038000000000000000000000000000000000000000000000000000000000000003c0000000000000000000000000000000000000000000000000000000000000000b0101010101000000010100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000005010100010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000a1e8f5d6ccd82f2a2ac4ca5df4d51c71e48a54d5000000000000000000000000000000000000000000000000000000000000008022d5e995295e4d3b8bd198dc4ed6381026e7520b1bc156174254b97f3662ebbc000000000000000000000000000000000000000000000000000000000000004113d756b32e6788c67a57e3e445e05f0629f0e6f1f0f8af95d8995fd7586fcde03c9589572c75141fe7041c8ca63eab97c8743e98b7c2582dd9382619b23a84dd010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002"
    })

    await anvilClient.stopImpersonatingAccount({
        address: rhinestoneAttester
    })

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

    // register 0xf048AD83CB2dfd6037A43902a2A5Be04e53cd2Eb
    await sendTransaction(walletClient, {
        account: kernelFactoryOwner,
        to: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3" /* kernel factory v0.6 */,
        data: "0xbb30a974000000000000000000000000f048ad83cb2dfd6037a43902a2a5be04e53cd2eb0000000000000000000000000000000000000000000000000000000000000001" /* setImplementation(address _implementation,bool _allow) */
    })

    // register 0xD3F582F6B4814E989Ee8E96bc3175320B5A540ab
    await sendTransaction(walletClient, {
        account: kernelFactoryOwner,
        to: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3" /* kernel factory v0.6 */,
        data: "0xbb30a974000000000000000000000000d3f582f6b4814e989ee8e96bc3175320b5a540ab0000000000000000000000000000000000000000000000000000000000000001" /* setImplementation(address _implementation,bool _allow) */
    })

    // register 0xd3082872F8B06073A021b4602e022d5A070d7cfC
    await sendTransaction(walletClient, {
        account: kernelFactoryOwner,
        to: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3" /* kernel factory v0.6 */,
        data: "0xbb30a974000000000000000000000000d3082872f8b06073a021b4602e022d5a070d7cfc0000000000000000000000000000000000000000000000000000000000000001" /* setImplementation(address _implementation,bool _allow) */
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

    // register 0x7a1dBAB750f12a90EB1B60D2Ae3aD17D4D81EfFe
    await sendTransaction(walletClient, {
        account: kernelFactoryOwner,
        to: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5" /* kernel factory v0.7 */,
        data: "0x6e7dbabb0000000000000000000000007a1dBAB750f12a90EB1B60D2Ae3aD17D4D81EfFe0000000000000000000000000000000000000000000000000000000000000001"
    })

    // register 0xE30c76Dc9eCF1c19F6Fec070674E1b4eFfE069FA
    await sendTransaction(walletClient, {
        account: kernelFactoryOwner,
        to: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5" /* kernel factory v0.7 */,
        data: "0x6e7dbabb000000000000000000000000E30c76Dc9eCF1c19F6Fec070674E1b4eFfE069FA0000000000000000000000000000000000000000000000000000000000000001"
    })

    // register 0x2577507b78c2008Ff367261CB6285d44ba5eF2E9
    await sendTransaction(walletClient, {
        account: kernelFactoryOwner,
        to: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5" /* kernel factory v0.7 */,
        data: "0x6e7dbabb0000000000000000000000002577507b78c2008Ff367261CB6285d44ba5eF2E90000000000000000000000000000000000000000000000000000000000000001"
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
        "0x4337084d9e255ff0702461cf8895ce9e3b5ff108", // EntryPoint 0.8
        "0x13E9ed32155810FDbd067D4522C492D6f68E5944", // Simple Account Factory 0.8
        "0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7", // Safe Singleton Factory
        "0x988C135a1049Ce61730724afD342fb7C56CD2776", // Biconomy Singleton Factory
        "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // EntryPoint 0.7
        "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985", // Simple Account Factory 0.7
        "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47", // Safe V0.7 Module Setup
        "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226", // Safe V0.7 4337 Module
        "0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb", // Safe V0.6 Module Setup
        "0xa581c4A4DB7175302464fF3C06380BC3270b4037", // Safe V0.6 4337 Module
        "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67", // Safe Proxy Factory
        "0x41675C099F32341bf84BFc5382aF534df5C7461a", // Safe Singleton
        "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526", // Safe Multi Send
        "0x9641d764fc13c8B624c04430C7356C1C7C8102e2", // Safe Multi Send Call Only
        "0x7579EE8307284F293B1927136486880611F20002", // Safe 7579 module
        "0x7579011aB74c46090561ea277Ba79D510c6C00ff", // Safe 7579 launchpad
        "0x000000000069E2a187AEFFb852bF3cCdC95151B2", // Safe 7579 Registry
        "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // EntryPoint 0.6
        "0x9406Cc6185a346906296840746125a0E44976454", // Simple Account Factory 0.6
        "0x0000001c5b32F37F5beA87BDD5374eB2aC54eA8e", // Biconomy ECDSA Ownership Registry Module
        "0x0000002512019Dafb59528B82CB92D3c5D2423ac", // Biconomy Account Logic V0.2
        "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5", // Biconomy Factory Address
        "0x0bBa6d96BD616BedC6BFaa341742FD43c60b83C1", // Biconomy Default Fallback Handler
        "0xf048AD83CB2dfd6037A43902a2A5Be04e53cd2Eb", // Kernel 0.2.1 Account Logic
        "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390", // Kernel v0.2.2 ECDSA Validator
        "0x0DA6a956B9488eD4dd761E59f52FDc6c8068E6B5", // Kernel v0.2.2 Account Logic
        "0xD3F582F6B4814E989Ee8E96bc3175320B5A540ab", // Kernel v0.2.3 Account Logic
        "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3", // Kernel v0.2.2 Factory
        "0xd3082872F8B06073A021b4602e022d5A070d7cfC", // Kernel v0.2.4 Factory
        "0x8104e3Ad430EA6d354d013A6789fDFc71E671c43", // Kernel v0.3.0 ECDSA Validator
        "0x94F097E1ebEB4ecA3AAE54cabb08905B239A7D27", // Kernel v0.3.0 Account Logic
        "0x6723b44Abeec4E71eBE3232BD5B455805baDD22f", // Kernel v0.3.0 Factory
        "0xd703aaE79538628d27099B8c4f621bE4CCd142d5", // Kernel v0.3.0 & v0.3.1 Meta Factory
        "0x845ADb2C711129d4f3966735eD98a9F09fC4cE57", // Kernel v0.3.1 ECDSA Validator
        "0xBAC849bB641841b44E965fB01A4Bf5F074f84b4D", // Kernel v0.3.1 Account Logic
        "0xaac5D4240AF87249B3f71BC8E4A2cae074A3E419", // Kernel v0.3.1 Factory
        "0xbA45a2BFb8De3D24cA9D7F1B551E14dFF5d690Fd", // Kernel v0.3.1 WebAuthn Validator
        "0xD830D15D3dc0C269F3dBAa0F3e8626d33CFdaBe1", // Kernel v0.3.2 Account Logic
        "0x7a1dBAB750f12a90EB1B60D2Ae3aD17D4D81EfFe", // Kernel v0.3.2 Factory
        "0xd6CEDDe84be40893d153Be9d467CD6aD37875b28", // Kernel v0.3.3 Account Logic
        "0x2577507b78c2008Ff367261CB6285d44ba5eF2E9", // Kernel v0.3.3 Factory
        "0x00004EC70002a32400f8ae005A26081065620D20", // LightAccountFactory v1.1.0
        "0xae8c656ad28F2B59a196AB61815C16A0AE1c3cba", // LightAccount v1.1.0 implementation
        "0x0000000000400CdFef5E2714E63d8040b700BC24", // LightAccountFactory v2.0.0
        "0x8E8e658E22B12ada97B402fF0b044D6A325013C7", // LightAccount v2.0.0 implementation
        "0x81b9E3689390C7e74cF526594A105Dea21a8cdD5", // Trust Secp256k1VerificationFacet
        "0x729c310186a57833f622630a16d13f710b83272a", // Trust factory
        "0xFde53272dcd7938d16E031A6989753c321728332", // Trust AccountFacet
        "0x0B9504140771C3688Ff041917192277D2f52E1e0", // Trust DiamondCutFacet
        "0x3143E1C0Af0Cdc153423863923Cf4e3818e34Daa", // Trust TokenReceiverFacet
        "0xCe36b85d12D81cd619C745c7717f3396E184Ac7C", // Trust DiamondLoupeFacet
        "0x2e7f1dAe1F3799d20f5c31bEFdc7A620f664728D", // Trust DefaultFallbackHandler
        "0x93FB56A4a0B7160fbf8903d251Cc7A3fb9bA0933", // Etherspot Factory
        "0x1baCB2F1ef4fD02f02e32cCF70888D9Caeb5f066", // Etherspot Bootstrap
        "0x7aCEE15c9FFc1e8f287C26E0f4C8244A0729F557", // Etherspot Multiple Owner ECDSA Validator
        "0x202A5598bDba2cE62bFfA13EcccB04969719Fad9", // Etherspot implementation
        "0x4Fd8d57b94966982B62e9588C27B4171B55E8354", // ERC7579 Test Module
        "0x85e23b94e7F5E9cC1fF78BCe78cfb15B81f0DF00", // Thirdweb factory 0.6
        "0x4be0ddfebca9a5a4a617dee4dece99e7c862dceb", // Thirdweb factory 0.7
        "0x00000bb19a3579F4D779215dEf97AFbd0e30DB55", // Nexus K1 Validator Factory
        "0x00000004171351c442B202678c48D8AB5B321E8f", // Nexus K1 Validator
        "0x000000039dfcAd030719B07296710F045F0558f7", // Nexus Account Implementation
        "0x00000008c901d8871b6F6942De0B5D9cCf3873d3", // Nexus Account Bootstrapper
        "0x6c77ddf87a1717465d29f8f16f44711eb0c839c0" // Nexus BootstrapLib
    ])
}
