import {
    type Account,
    type Address,
    type Chain,
    type PublicClient,
    type Transport,
    type WalletClient,
    concat,
    encodeFunctionData,
    getCreate2Address,
    pad,
    parseAbi,
    toHex
} from "viem"
import { getAnvilWalletClient } from "./utils"

const ERC20_BYTECODE = concat([
    "0x60a060405234801561001057600080fd5b50604051610ff0380380610ff083398101604081905261002f9161022c565b6040518060400160405280600981526020016805465737445524332360bc1b8152506040518060400160405280600381526020016205432360ec1b815250816003908161007c919061034d565b506004610089828261034d565b5050506100a63369d3c21bcecceda10000006100b160201b60201c565b60ff166080526104a3565b6001600160a01b0382166100e457600060405163ec442f0560e01b81526004016100db9190610430565b60405180910390fd5b6100f0600083836100f4565b5050565b6001600160a01b03831661011f5780600260008282546101149190610454565b9091555061017e9050565b6001600160a01b0383166000908152602081905260409020548181101561015f5783818360405163391434e360e21b81526004016100db9392919061046d565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b03821661019a576002805482900390556101b9565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516101fc9190610495565b60405180910390a3505050565b60ff8116811461021857600080fd5b50565b805161022681610209565b92915050565b60006020828403121561024157610241600080fd5b600061024d848461021b565b949350505050565b634e487b7160e01b600052604160045260246000fd5b634e487b7160e01b600052602260045260246000fd5b60028104600182168061029557607f821691505b6020821081036102a7576102a761026b565b50919050565b60006102266102b98381565b90565b6102c5836102ad565b815460001960089490940293841b1916921b91909117905550565b60006102ed8184846102bc565b505050565b818110156100f0576103056000826102e0565b6001016102f2565b601f8211156102ed576000818152602090206020601f850104810160208510156103345750805b6103466020601f8601048301826102f2565b5050505050565b81516001600160401b0381111561036657610366610255565b6103708254610281565b61037b82828561030d565b6020601f8311600181146103af57600084156103975750858201515b600019600886021c1981166002860217865550610408565b600085815260208120601f198616915b828110156103df57888501518255602094850194600190920191016103bf565b868310156103fb5784890151600019601f89166008021c191682555b6001600288020188555050505b505050505050565b60006001600160a01b038216610226565b61042a81610410565b82525050565b602081016102268284610421565b634e487b7160e01b600052601160045260246000fd5b808201808211156102265761022661043e565b8061042a565b6060810161047b8286610421565b6104886020830185610467565b61024d6040830184610467565b602081016102268284610467565b608051610b326104be60003960006101650152610b326000f3fe608060405234801561001057600080fd5b50600436106100d45760003560e01c8063313ce56711610081578063a9059cbb1161005b578063a9059cbb146101cf578063dd62ed3e146101e2578063fb4dcefa1461022857600080fd5b8063313ce5671461016357806370a082311461019157806395d89b41146101c757600080fd5b806318160ddd116100b257806318160ddd1461012c57806323b872dd1461013d5780632d688ca81461015057600080fd5b806305ea5c22146100d957806306fdde03146100ee578063095ea7b31461010c575b600080fd5b6100ec6100e7366004610868565b61023b565b005b6100f661024b565b604051610103919061092c565b60405180910390f35b61011f61011a366004610944565b6102dd565b604051610103919061098b565b6002545b604051610103919061099f565b61011f61014b366004610868565b6102f7565b6100ec61015e366004610944565b61031b565b7f000000000000000000000000000000000000000000000000000000000000000060405161010391906109b6565b61013061019f3660046109c4565b73ffffffffffffffffffffffffffffffffffffffff1660009081526020819052604090205490565b6100f6610329565b61011f6101dd366004610944565b610338565b6101306101f03660046109ed565b73ffffffffffffffffffffffffffffffffffffffff918216600090815260016020908152604080832093909416825291909152205490565b6100ec6102363660046109ed565b610346565b61024683838361037c565b505050565b60606003805461025a90610a4f565b80601f016020809104026020016040519081016040528092919081815260200182805461028690610a4f565b80156102d35780601f106102a8576101008083540402835291602001916102d3565b820191906000526020600020905b8154815290600101906020018083116102b657829003601f168201915b5050505050905090565b6000336102eb81858561037c565b60019150505b92915050565b600033610305858285610389565b610310858585610441565b506001949350505050565b61032582826104ec565b5050565b60606004805461025a90610a4f565b6000336102eb818585610441565b61032582826103778573ffffffffffffffffffffffffffffffffffffffff1660009081526020819052604090205490565b610441565b6102468383836001610548565b73ffffffffffffffffffffffffffffffffffffffff8381166000908152600160209081526040808320938616835292905220547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff811461043b578181101561042c578281836040517ffb8f41b200000000000000000000000000000000000000000000000000000000815260040161042393929190610a84565b60405180910390fd5b61043b84848484036000610548565b50505050565b73ffffffffffffffffffffffffffffffffffffffff83166104915760006040517f96c6fd1e0000000000000000000000000000000000000000000000000000000081526004016104239190610aac565b73ffffffffffffffffffffffffffffffffffffffff82166104e15760006040517fec442f050000000000000000000000000000000000000000000000000000000081526004016104239190610aac565b61024683838361068e565b73ffffffffffffffffffffffffffffffffffffffff821661053c5760006040517fec442f050000000000000000000000000000000000000000000000000000000081526004016104239190610aac565b6103256000838361068e565b73ffffffffffffffffffffffffffffffffffffffff84166105985760006040517fe602df050000000000000000000000000000000000000000000000000000000081526004016104239190610aac565b73ffffffffffffffffffffffffffffffffffffffff83166105e85760006040517f94280d620000000000000000000000000000000000000000000000000000000081526004016104239190610aac565b73ffffffffffffffffffffffffffffffffffffffff8085166000908152600160209081526040808320938716835292905220829055801561043b578273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92584604051610680919061099f565b60405180910390a350505050565b73ffffffffffffffffffffffffffffffffffffffff83166106c65780600260008282546106bb9190610ae9565b909155506107589050565b73ffffffffffffffffffffffffffffffffffffffff83166000908152602081905260409020548181101561072c578381836040517fe450d38c00000000000000000000000000000000000000000000000000000000815260040161042393929190610a84565b73ffffffffffffffffffffffffffffffffffffffff841660009081526020819052604090209082900390555b73ffffffffffffffffffffffffffffffffffffffff8216610781576002805482900390556107ad565b73ffffffffffffffffffffffffffffffffffffffff821660009081526020819052604090208054820190555b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161080a919061099f565b60405180910390a3505050565b600073ffffffffffffffffffffffffffffffffffffffff82166102f1565b61083e81610817565b811461084957600080fd5b50565b80356102f181610835565b8061083e565b80356102f181610857565b60008060006060848603121561088057610880600080fd5b600061088c868661084c565b935050602061089d8682870161084c565b92505060406108ae8682870161085d565b9150509250925092565b60005b838110156108d35781810151838201526020016108bb565b50506000910152565b60006108e6825190565b8084526020840193506108fd8185602086016108b8565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920192915050565b6020808252810161093d81846108dc565b9392505050565b6000806040838503121561095a5761095a600080fd5b6000610966858561084c565b92505060206109778582860161085d565b9150509250929050565b8015155b82525050565b602081016102f18284610981565b80610985565b602081016102f18284610999565b60ff8116610985565b602081016102f182846109ad565b6000602082840312156109d9576109d9600080fd5b60006109e5848461084c565b949350505050565b60008060408385031215610a0357610a03600080fd5b6000610a0f858561084c565b92505060206109778582860161084c565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600281046001821680610a6357607f821691505b602082108103610a7557610a75610a20565b50919050565b61098581610817565b60608101610a928286610a7b565b610a9f6020830185610999565b6109e56040830184610999565b602081016102f18284610a7b565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b808201808211156102f1576102f1610aba56fea2646970667358221220d40f68e247510ec8b7876d327ac47b949de248d0626aaf2670151c5e84ee6b4a64736f6c634300081a0033",
    pad(toHex(18n)) // constructor args (token_decimals)
])

export const deployErc20Token = async (
    walletClient: WalletClient<Transport, Chain, Account>,
    publicClient: PublicClient
) => {
    if (
        (await publicClient.getCode({ address: ERC20_ADDRESS })) === undefined
    ) {
        await walletClient.sendTransaction({
            to: "0x4e59b44847b379578588920ca78fbf26c0b4956c",
            data: concat([
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                ERC20_BYTECODE
            ])
        })
    }
}

export const sudoMintTokens = async ({
    amount,
    to,
    anvilRpc
}: {
    amount: bigint
    to: Address
    anvilRpc: string
}) => {
    const walletClient = getAnvilWalletClient({ addressIndex: 10, anvilRpc })

    await walletClient.sendTransaction({
        to: ERC20_ADDRESS,
        value: 0n,
        data: encodeFunctionData({
            abi: parseAbi(["function sudoMint(address, uint256)"]),
            args: [to, amount]
        })
    })
}

export const ERC20_ADDRESS = getCreate2Address({
    from: "0x4e59b44847b379578588920ca78fbf26c0b4956c",
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
    bytecode: ERC20_BYTECODE
})
