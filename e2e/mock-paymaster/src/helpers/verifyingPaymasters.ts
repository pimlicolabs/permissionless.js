import {
    type Account,
    type Address,
    type Chain,
    type Hex,
    type Transport,
    type WalletClient,
    concat,
    getContract,
    getContractAddress,
    pad,
    parseEther,
    slice,
    createPublicClient,
    http
} from "viem"
import { VERIFYING_PAYMASTER_V06_ABI, VERIFYING_PAYMASTER_V07_ABI } from "./abi"
import { waitForTransactionReceipt } from "viem/actions"
import { foundry } from "viem/chains"

const DETERMINISTIC_DEPLOYER = "0x4e59b44847b379578588920ca78fbf26c0b4956c"

// Creates the call that deploys the VerifyingPaymaster v0.7
const VERIFYING_PAYMASTER_V07_CALL = (owner: Address): Hex =>
    concat([
        "0x000000000000000000000000000000000000000000000000000000000000000060c06040523480156200001157600080fd5b506040516200145938038062001459833981016040819052620000349162000236565b8233806200005d57604051631e4fbdf760e01b8152600060048201526024015b60405180910390fd5b62000068816200009b565b506200007481620000eb565b6001600160a01b03908116608052821660a0526200009281620001ae565b505050620002b5565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b6040516301ffc9a760e01b815263122a0e9b60e31b60048201526001600160a01b038216906301ffc9a790602401602060405180830381865afa15801562000137573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906200015d91906200028a565b620001ab5760405162461bcd60e51b815260206004820152601e60248201527f49456e747279506f696e7420696e74657266616365206d69736d617463680000604482015260640162000054565b50565b620001b8620001ef565b6001600160a01b038116620001e457604051631e4fbdf760e01b81526000600482015260240162000054565b620001ab816200009b565b6000546001600160a01b031633146200021e5760405163118cdaa760e01b815233600482015260240162000054565b565b6001600160a01b0381168114620001ab57600080fd5b6000806000606084860312156200024c57600080fd5b8351620002598162000220565b60208501519093506200026c8162000220565b60408501519092506200027f8162000220565b809150509250925092565b6000602082840312156200029d57600080fd5b81518015158114620002ae57600080fd5b9392505050565b60805160a051611146620003136000396000818161013401526109a40152600081816102640152818161031a015281816103b1015281816105ab01528181610645015281816106b501528181610742015261080a01526111466000f3fe6080604052600436106100e85760003560e01c80638da5cb5b1161008a578063c23a5cea11610059578063c23a5cea1461029b578063c399ec88146102bb578063d0e30db0146102d0578063f2fde38b146102d857600080fd5b80638da5cb5b1461020457806394d4ad6014610222578063b0d691fe14610252578063bb9fe6bf1461028657600080fd5b806352b7512c116100c657806352b7512c146101735780635829c5f5146101a1578063715018a6146101cf5780637c627b21146101e457600080fd5b80630396cb60146100ed578063205c28781461010257806323d9ac9b14610122575b600080fd5b6101006100fb366004610cec565b6102f8565b005b34801561010e57600080fd5b5061010061011d366004610d2e565b610383565b34801561012e57600080fd5b506101567f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020015b60405180910390f35b34801561017f57600080fd5b5061019361018e366004610d73565b6103f5565b60405161016a929190610dc1565b3480156101ad57600080fd5b506101c16101bc366004610e31565b610419565b60405190815260200161016a565b3480156101db57600080fd5b50610100610529565b3480156101f057600080fd5b506101006101ff366004610ed8565b61053d565b34801561021057600080fd5b506000546001600160a01b0316610156565b34801561022e57600080fd5b5061024261023d366004610f43565b610559565b60405161016a9493929190610f85565b34801561025e57600080fd5b506101567f000000000000000000000000000000000000000000000000000000000000000081565b34801561029257600080fd5b506101006105a1565b3480156102a757600080fd5b506101006102b6366004610fd1565b61061e565b3480156102c757600080fd5b506101c161069d565b61010061072d565b3480156102e457600080fd5b506101006102f3366004610fd1565b61078f565b6103006107d2565b604051621cb65b60e51b815263ffffffff821660048201527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031690630396cb609034906024016000604051808303818588803b15801561036757600080fd5b505af115801561037b573d6000803e3d6000fd5b505050505050565b61038b6107d2565b60405163040b850f60e31b81526001600160a01b038381166004830152602482018390527f0000000000000000000000000000000000000000000000000000000000000000169063205c287890604401600060405180830381600087803b15801561036757600080fd5b606060006104016107ff565b61040c85858561086f565b915091505b935093915050565b600083358060208601356104306040880188610fee565b60405161043e929190611035565b6040519081900390206104546060890189610fee565b604051610462929190611035565b604051908190039020608089013561047d60e08b018b610fee565b61048c91603491601491611045565b6104959161106f565b604080516001600160a01b0390971660208801528601949094526060850192909252608084015260a08084019190915260c08084019290925287013560e0830152860135610100820152466101208201523061014082015265ffffffffffff80861661016083015284166101808201526101a001604051602081830303815290604052805190602001209150509392505050565b6105316107d2565b61053b6000610a27565b565b6105456107ff565b6105528585858585610a77565b5050505050565b600080368161056b8560348189611045565b810190610578919061108d565b9094509250858561058b603460406110c0565b610596928290611045565b949793965094505050565b6105a96107d2565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663bb9fe6bf6040518163ffffffff1660e01b8152600401600060405180830381600087803b15801561060457600080fd5b505af1158015610618573d6000803e3d6000fd5b50505050565b6106266107d2565b60405163611d2e7560e11b81526001600160a01b0382811660048301527f0000000000000000000000000000000000000000000000000000000000000000169063c23a5cea90602401600060405180830381600087803b15801561068957600080fd5b505af1158015610552573d6000803e3d6000fd5b6040516370a0823160e01b81523060048201526000907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa158015610704573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061072891906110e1565b905090565b60405163b760faf960e01b81523060048201527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063b760faf99034906024016000604051808303818588803b15801561068957600080fd5b6107976107d2565b6001600160a01b0381166107c657604051631e4fbdf760e01b8152600060048201526024015b60405180910390fd5b6107cf81610a27565b50565b6000546001600160a01b0316331461053b5760405163118cdaa760e01b81523360048201526024016107bd565b336001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000161461053b5760405162461bcd60e51b815260206004820152601560248201527414d95b99195c881b9bdd08115b9d1c9e541bda5b9d605a1b60448201526064016107bd565b606060008080368161088761023d60e08b018b610fee565b9296509094509250905060408114806108a05750604181145b610914576040805162461bcd60e51b81526020600482015260248101919091527f566572696679696e675061796d61737465723a20696e76616c6964207369676e60448201527f6174757265206c656e67746820696e207061796d6173746572416e644461746160648201526084016107bd565b60006109576109248b8787610419565b7f19457468657265756d205369676e6564204d6573736167653a0a3332000000006000908152601c91909152603c902090565b90506109998184848080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250610aaf92505050565b6001600160a01b03167f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316146109fc576109dd60018686610adb565b6040518060200160405280600081525090965096505050505050610411565b610a0860008686610adb565b6040805160208101909152600081529b909a5098505050505050505050565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b60405162461bcd60e51b815260206004820152600d60248201526c6d757374206f7665727269646560981b60448201526064016107bd565b600080600080610abf8686610b13565b925092509250610acf8282610b60565b50909150505b92915050565b600060d08265ffffffffffff16901b60a08465ffffffffffff16901b85610b03576000610b06565b60015b60ff161717949350505050565b60008060008351604103610b4d5760208401516040850151606086015160001a610b3f88828585610c1d565b955095509550505050610b59565b50508151600091506002905b9250925092565b6000826003811115610b7457610b746110fa565b03610b7d575050565b6001826003811115610b9157610b916110fa565b03610baf5760405163f645eedf60e01b815260040160405180910390fd5b6002826003811115610bc357610bc36110fa565b03610be45760405163fce698f760e01b8152600481018290526024016107bd565b6003826003811115610bf857610bf86110fa565b03610c19576040516335e2f38360e21b8152600481018290526024016107bd565b5050565b600080807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0841115610c585750600091506003905082610ce2565b604080516000808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa158015610cac573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116610cd857506000925060019150829050610ce2565b9250600091508190505b9450945094915050565b600060208284031215610cfe57600080fd5b813563ffffffff81168114610d1257600080fd5b9392505050565b6001600160a01b03811681146107cf57600080fd5b60008060408385031215610d4157600080fd5b8235610d4c81610d19565b946020939093013593505050565b60006101208284031215610d6d57600080fd5b50919050565b600080600060608486031215610d8857600080fd5b833567ffffffffffffffff811115610d9f57600080fd5b610dab86828701610d5a565b9660208601359650604090950135949350505050565b604081526000835180604084015260005b81811015610def5760208187018101516060868401015201610dd2565b506000606082850101526060601f19601f8301168401019150508260208301529392505050565b803565ffffffffffff81168114610e2c57600080fd5b919050565b600080600060608486031215610e4657600080fd5b833567ffffffffffffffff811115610e5d57600080fd5b610e6986828701610d5a565b935050610e7860208501610e16565b9150610e8660408501610e16565b90509250925092565b60008083601f840112610ea157600080fd5b50813567ffffffffffffffff811115610eb957600080fd5b602083019150836020828501011115610ed157600080fd5b9250929050565b600080600080600060808688031215610ef057600080fd5b853560038110610eff57600080fd5b9450602086013567ffffffffffffffff811115610f1b57600080fd5b610f2788828901610e8f565b9699909850959660408101359660609091013595509350505050565b60008060208385031215610f5657600080fd5b823567ffffffffffffffff811115610f6d57600080fd5b610f7985828601610e8f565b90969095509350505050565b600065ffffffffffff808716835280861660208401525060606040830152826060830152828460808401376000608084840101526080601f19601f850116830101905095945050505050565b600060208284031215610fe357600080fd5b8135610d1281610d19565b6000808335601e1984360301811261100557600080fd5b83018035915067ffffffffffffffff82111561102057600080fd5b602001915036819003821315610ed157600080fd5b8183823760009101908152919050565b6000808585111561105557600080fd5b8386111561106257600080fd5b5050820193919092039150565b80356020831015610ad557600019602084900360031b1b1692915050565b600080604083850312156110a057600080fd5b6110a983610e16565b91506110b760208401610e16565b90509250929050565b80820180821115610ad557634e487b7160e01b600052601160045260246000fd5b6000602082840312156110f357600080fd5b5051919050565b634e487b7160e01b600052602160045260246000fdfea26469706673582212209da0f81924019274222346779de206a7e6bccf682a1e50527de363f369f94d0564736f6c634300081700330000000000000000000000000000000071727de22e5e9d8baf0edac6f37da032",
        pad(owner),
        pad(owner)
    ])

// Creates the call that deploys the VerifyingPaymaster v0.6
const VERIFYING_PAYMASTER_V06_CALL = (owner: Address): Hex =>
    concat([
        "0x000000000000000000000000000000000000000000000000000000000000000060c06040523480156200001157600080fd5b5060405162001401380380620014018339810160408190526200003491620001ad565b81620000403362000066565b6001600160a01b03908116608052811660a0526200005e81620000b6565b5050620001ec565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b620000c062000139565b6001600160a01b0381166200012b5760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b60648201526084015b60405180910390fd5b620001368162000066565b50565b6000546001600160a01b03163314620001955760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015260640162000122565b565b6001600160a01b03811681146200013657600080fd5b60008060408385031215620001c157600080fd5b8251620001ce8162000197565b6020840151909250620001e18162000197565b809150509250929050565b60805160a0516111b76200024a600039600081816101340152610a310152600081816102360152818161031a015281816103b1015281816104ac01528181610540015281816105b701528181610644015261083e01526111b76000f3fe6080604052600436106100e85760003560e01c8063a9a234091161008a578063c399ec8811610059578063c399ec881461028d578063d0e30db0146102a2578063f2fde38b146102aa578063f465c77e146102ca57600080fd5b8063a9a2340914610204578063b0d691fe14610224578063bb9fe6bf14610258578063c23a5cea1461026d57600080fd5b8063715018a6116100c6578063715018a6146101735780638da5cb5b1461018857806394d4ad60146101a657806394e1fc19146101d657600080fd5b80630396cb60146100ed578063205c28781461010257806323d9ac9b14610122575b600080fd5b6101006100fb366004610d63565b6102f8565b005b34801561010e57600080fd5b5061010061011d366004610da5565b610383565b34801561012e57600080fd5b506101567f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020015b60405180910390f35b34801561017f57600080fd5b506101006103f5565b34801561019457600080fd5b506000546001600160a01b0316610156565b3480156101b257600080fd5b506101c66101c1366004610e13565b610409565b60405161016a9493929190610e55565b3480156101e257600080fd5b506101f66101f1366004610ed5565b610446565b60405190815260200161016a565b34801561021057600080fd5b5061010061021f366004610f33565b610488565b34801561023057600080fd5b506101567f000000000000000000000000000000000000000000000000000000000000000081565b34801561026457600080fd5b506101006104a2565b34801561027957600080fd5b50610100610288366004610f93565b610519565b34801561029957600080fd5b506101f661059f565b61010061062f565b3480156102b657600080fd5b506101006102c5366004610f93565b610691565b3480156102d657600080fd5b506102ea6102e5366004610fb0565b61070f565b60405161016a929190611044565b610300610733565b604051621cb65b60e51b815263ffffffff821660048201527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031690630396cb609034906024016000604051808303818588803b15801561036757600080fd5b505af115801561037b573d6000803e3d6000fd5b505050505050565b61038b610733565b60405163040b850f60e31b81526001600160a01b038381166004830152602482018390527f0000000000000000000000000000000000000000000000000000000000000000169063205c287890604401600060405180830381600087803b15801561036757600080fd5b6103fd610733565b610407600061078d565b565b600080368161041c605460148789611066565b8101906104299190611090565b909450925061043b8560548189611066565b949793965094505050565b6000610451846107dd565b463085856040516020016104699594939291906110c3565b6040516020818303038152906040528051906020012090509392505050565b610490610833565b61049c848484846108a3565b50505050565b6104aa610733565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663bb9fe6bf6040518163ffffffff1660e01b8152600401600060405180830381600087803b15801561050557600080fd5b505af115801561049c573d6000803e3d6000fd5b610521610733565b60405163611d2e7560e11b81526001600160a01b0382811660048301527f0000000000000000000000000000000000000000000000000000000000000000169063c23a5cea90602401600060405180830381600087803b15801561058457600080fd5b505af1158015610598573d6000803e3d6000fd5b5050505050565b6040516370a0823160e01b81523060048201526000907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906370a0823190602401602060405180830381865afa158015610606573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061062a919061110b565b905090565b60405163b760faf960e01b81523060048201527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063b760faf99034906024016000604051808303818588803b15801561058457600080fd5b610699610733565b6001600160a01b0381166107035760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b60648201526084015b60405180910390fd5b61070c8161078d565b50565b6060600061071b610833565b6107268585856108db565b915091505b935093915050565b6000546001600160a01b031633146104075760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016106fa565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b60603660006107f0610120850185611124565b9150915083610120610180828503038082016040519650602081018701604052808752508183602088013780604083850101836020890101375050505050919050565b336001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016146104075760405162461bcd60e51b815260206004820152601560248201527414d95b99195c881b9bdd08115b9d1c9e541bda5b9d605a1b60448201526064016106fa565b60405162461bcd60e51b815260206004820152600d60248201526c6d757374206f7665727269646560981b60448201526064016106fa565b60606000808036816108f46101c16101208b018b611124565b92965090945092509050604081148061090d5750604181145b610981576040805162461bcd60e51b81526020600482015260248101919091527f566572696679696e675061796d61737465723a20696e76616c6964207369676e60448201527f6174757265206c656e67746820696e207061796d6173746572416e644461746160648201526084016106fa565b60006109e46109918b8787610446565b6040517f19457468657265756d205369676e6564204d6573736167653a0a3332000000006020820152603c8101829052600090605c01604051602081830303815290604052805190602001209050919050565b9050610a268184848080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250610ab492505050565b6001600160a01b03167f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031614610a8957610a6a60018686610ad8565b604051806020016040528060008152509096509650505050505061072b565b610a9560008686610ad8565b6040805160208101909152600081529b909a5098505050505050505050565b6000806000610ac38585610b10565b91509150610ad081610b55565b509392505050565b600060d08265ffffffffffff16901b60a08465ffffffffffff16901b85610b00576000610b03565b60015b60ff161717949350505050565b6000808251604103610b465760208301516040840151606085015160001a610b3a87828585610c9f565b94509450505050610b4e565b506000905060025b9250929050565b6000816004811115610b6957610b6961116b565b03610b715750565b6001816004811115610b8557610b8561116b565b03610bd25760405162461bcd60e51b815260206004820152601860248201527f45434453413a20696e76616c6964207369676e6174757265000000000000000060448201526064016106fa565b6002816004811115610be657610be661116b565b03610c335760405162461bcd60e51b815260206004820152601f60248201527f45434453413a20696e76616c6964207369676e6174757265206c656e6774680060448201526064016106fa565b6003816004811115610c4757610c4761116b565b0361070c5760405162461bcd60e51b815260206004820152602260248201527f45434453413a20696e76616c6964207369676e6174757265202773272076616c604482015261756560f01b60648201526084016106fa565b6000807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0831115610cd65750600090506003610d5a565b6040805160008082526020820180845289905260ff881692820192909252606081018690526080810185905260019060a0016020604051602081039080840390855afa158015610d2a573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116610d5357600060019250925050610d5a565b9150600090505b94509492505050565b600060208284031215610d7557600080fd5b813563ffffffff81168114610d8957600080fd5b9392505050565b6001600160a01b038116811461070c57600080fd5b60008060408385031215610db857600080fd5b8235610dc381610d90565b946020939093013593505050565b60008083601f840112610de357600080fd5b50813567ffffffffffffffff811115610dfb57600080fd5b602083019150836020828501011115610b4e57600080fd5b60008060208385031215610e2657600080fd5b823567ffffffffffffffff811115610e3d57600080fd5b610e4985828601610dd1565b90969095509350505050565b600065ffffffffffff808716835280861660208401525060606040830152826060830152828460808401376000608084840101526080601f19601f850116830101905095945050505050565b60006101608284031215610eb457600080fd5b50919050565b803565ffffffffffff81168114610ed057600080fd5b919050565b600080600060608486031215610eea57600080fd5b833567ffffffffffffffff811115610f0157600080fd5b610f0d86828701610ea1565b935050610f1c60208501610eba565b9150610f2a60408501610eba565b90509250925092565b60008060008060608587031215610f4957600080fd5b843560038110610f5857600080fd5b9350602085013567ffffffffffffffff811115610f7457600080fd5b610f8087828801610dd1565b9598909750949560400135949350505050565b600060208284031215610fa557600080fd5b8135610d8981610d90565b600080600060608486031215610fc557600080fd5b833567ffffffffffffffff811115610fdc57600080fd5b610fe886828701610ea1565b9660208601359650604090950135949350505050565b6000815180845260005b8181101561102457602081850181015186830182015201611008565b506000602082860101526020601f19601f83011685010191505092915050565b6040815260006110576040830185610ffe565b90508260208301529392505050565b6000808585111561107657600080fd5b8386111561108357600080fd5b5050820193919092039150565b600080604083850312156110a357600080fd5b6110ac83610eba565b91506110ba60208401610eba565b90509250929050565b60a0815260006110d660a0830188610ffe565b6020830196909652506001600160a01b0393909316604084015265ffffffffffff918216606084015216608090910152919050565b60006020828403121561111d57600080fd5b5051919050565b6000808335601e1984360301811261113b57600080fd5b83018035915067ffffffffffffffff82111561115657600080fd5b602001915036819003821315610b4e57600080fd5b634e487b7160e01b600052602160045260246000fdfea2646970667358221220bc69dcc52cd6c4ebdf52276b6a56f83b85831b738e3b681ab51ab0bbab6a03c164736f6c634300081100330000000000000000000000005ff137d4b0fdcd49dca30c7cf57e578a026d2789",
        pad(owner)
    ])

export const setupVerifyingPaymasterV07 = async (
    walletClient: WalletClient<Transport, Chain, Account>
) => {
    const data = VERIFYING_PAYMASTER_V07_CALL(walletClient.account.address)

    const publicClient = createPublicClient({
        transport: http(process.env.ANVIL_RPC),
        chain: foundry
    })

    await walletClient
        .sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data
        })
        .then((hash) => publicClient.waitForTransactionReceipt({ hash }))
        .then(() => console.log("deployed VerifyingPaymaster v0.7"))

    const address = getContractAddress({
        opcode: "CREATE2",
        from: DETERMINISTIC_DEPLOYER,
        salt: slice(data, 0, 32),
        bytecode: slice(data, 32)
    })

    const verifyingPaymaster = getContract({
        address,
        abi: VERIFYING_PAYMASTER_V07_ABI,
        client: walletClient
    })

    await verifyingPaymaster.write
        .deposit({
            value: parseEther("50")
        })
        .then(() => console.log("Funded VerifyingPaymaster V0.7"))

    return verifyingPaymaster
}

export const setupVerifyingPaymasterV06 = async (
    walletClient: WalletClient<Transport, Chain, Account>
) => {
    const data = VERIFYING_PAYMASTER_V06_CALL(walletClient.account.address)

    const publicClient = createPublicClient({
        transport: http(process.env.ANVIL_RPC),
        chain: foundry
    })

    await walletClient
        .sendTransaction({
            to: DETERMINISTIC_DEPLOYER,
            data
        })
        .then((hash) => publicClient.waitForTransactionReceipt({ hash }))
        .then(() => console.log("deployed VerifyingPaymaster v0.6"))

    const address = getContractAddress({
        opcode: "CREATE2",
        from: DETERMINISTIC_DEPLOYER,
        salt: slice(data, 0, 32),
        bytecode: slice(data, 32)
    })

    const verifyingPaymaster = getContract({
        address,
        abi: VERIFYING_PAYMASTER_V06_ABI,
        client: walletClient
    })

    await verifyingPaymaster.write
        .deposit({
            value: parseEther("50")
        })
        .then(() => console.log("Funded VerifyingPaymaster V0.6"))

    return verifyingPaymaster
}
