import {
    type Account,
    type Address,
    type Assign,
    type Chain,
    type Client,
    type EIP1193Provider,
    type Hex,
    type JsonRpcAccount,
    type LocalAccount,
    type OneOf,
    type Transport,
    type WalletClient,
    encodeAbiParameters,
    encodeFunctionData,
    encodePacked,
    toHex,
    zeroAddress
} from "viem"
import {
    type SmartAccount,
    type SmartAccountImplementation,
    type UserOperation,
    entryPoint07Abi,
    entryPoint07Address,
    getUserOperationHash,
    toSmartAccount
} from "viem/account-abstraction"
import { getChainId } from "viem/actions"
import { getAction } from "viem/utils"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"
import { getSenderAddress } from "../../actions/public/getSenderAddress.js"
import { decode7579Calls } from "../../utils/decode7579Calls.js"
import { encode7579Calls } from "../../utils/encode7579Calls.js"
import { toOwner } from "../../utils/index.js"
import {
    DEFAULT_CONTRACT_ADDRESS,
    DUMMY_ECDSA_SIGNATURE,
    type NetworkAddresses
} from "./constants.js"
import { getInitMSAData } from "./utils/getInitMSAData.js"
import { getNonceKeyWithEncoding } from "./utils/getNonceKey.js"

/**
 * The account creation ABI for a modular etherspot smart account
 */
const createAccountAbi = [
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "salt",
                type: "bytes32"
            },
            {
                internalType: "bytes",
                name: "initCode",
                type: "bytes"
            }
        ],
        name: "createAccount",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "payable",
        type: "function"
    }
] as const

/**
 * Get default addresses for Etherspot Smart Account based on chainId
 * @param chainId
 * @param validatorAddress
 * @param accountLogicAddress
 * @param factoryAddress
 * @param metaFactoryAddress
 */
const getDefaultAddresses = ({
    validatorAddress: _validatorAddress,
    metaFactoryAddress: _metaFactoryAddress,
    bootstrapAddress: _bootstrapAddress
}: Partial<NetworkAddresses>): NetworkAddresses => {
    const addresses = DEFAULT_CONTRACT_ADDRESS
    const validatorAddress = _validatorAddress ?? addresses.validatorAddress
    const metaFactoryAddress =
        _metaFactoryAddress ?? addresses?.metaFactoryAddress ?? zeroAddress
    const bootstrapAddress =
        _bootstrapAddress ?? addresses.bootstrapAddress ?? zeroAddress

    return {
        validatorAddress,
        metaFactoryAddress,
        bootstrapAddress
    }
}

/**
 * Get the initialization data for a etherspot smart account
 * @param entryPoint
 * @param owner
 * @param validatorAddress
 */
const getInitialisationData = ({
    owner,
    validatorAddress,
    bootstrapAddress
}: {
    owner: Address
    validatorAddress: Address
    bootstrapAddress: Address
}) => {
    const initMSAData = getInitMSAData(validatorAddress)

    const initCode = encodeAbiParameters(
        [{ type: "address" }, { type: "address" }, { type: "bytes" }],
        [owner, bootstrapAddress, initMSAData]
    )

    return initCode
}

/**
 * Get the account initialization code for a etherspot smart account
 * @param entryPoint
 * @param owner
 * @param index
 * @param validatorAddress
 * @param bootstrapAddress
 */
const getAccountInitCode = async ({
    owner,
    index,
    validatorAddress,
    bootstrapAddress
}: {
    owner: Address
    index: bigint
    validatorAddress: Address
    bootstrapAddress: Address
}): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")

    // Build the account initialization data
    const initialisationData = getInitialisationData({
        validatorAddress,
        owner,
        bootstrapAddress
    })

    return encodeFunctionData({
        abi: createAccountAbi,
        functionName: "createAccount",
        args: [toHex(index, { size: 32 }), initialisationData]
    })
}

export type ToEtherspotSmartAccountParameters<
    entryPointVersion extends "0.6" | "0.7"
> = {
    client: Client<
        Transport,
        Chain | undefined,
        JsonRpcAccount | LocalAccount | undefined
    >
    owners: [
        OneOf<
            | EIP1193Provider
            | WalletClient<Transport, Chain | undefined, Account>
            | LocalAccount
        >
    ]
    entryPoint?: {
        address: Address
        version: entryPointVersion
    }
    address?: Address
    index?: bigint
    metaFactoryAddress?: Address
    validatorAddress?: Address
    bootstrapAddress?: Address
    nonceKey?: bigint
}

export type EtherspotSmartAccountImplementation<
    entryPointVersion extends "0.7" = "0.7"
> = Assign<
    SmartAccountImplementation<
        typeof entryPoint07Abi,
        entryPointVersion
        // {
        //     // entryPoint === ENTRYPOINT_ADDRESS_V06 ? "0.2.2" : "0.3.0-beta"
        //     abi: entryPointVersion extends "0.6" ? typeof BiconomyAbi
        //     factory: { abi: typeof FactoryAbi; address: Address }
        // }
    >,
    { sign: NonNullable<SmartAccountImplementation["sign"]> }
>

export type ToEtherspotSmartAccountReturnType<
    entryPointVersion extends "0.7" = "0.7"
> = SmartAccount<EtherspotSmartAccountImplementation<entryPointVersion>>

export async function toEtherspotSmartAccount<entryPointVersion extends "0.7">(
    parameters: ToEtherspotSmartAccountParameters<entryPointVersion>
): Promise<ToEtherspotSmartAccountReturnType<entryPointVersion>> {
    const {
        client,
        owners,
        address,
        index = BigInt(0),
        metaFactoryAddress: _metaFactoryAddress,
        validatorAddress: _validatorAddress,
        bootstrapAddress: _bootstrapAddress
    } = parameters

    const localOwner = await toOwner({ owner: owners[0] })

    const entryPoint = {
        address: parameters.entryPoint?.address ?? entryPoint07Address,
        abi: entryPoint07Abi,
        version: parameters.entryPoint?.version ?? "0.7"
    } as const

    const { validatorAddress, metaFactoryAddress, bootstrapAddress } =
        getDefaultAddresses({
            validatorAddress: _validatorAddress,
            metaFactoryAddress: _metaFactoryAddress,
            bootstrapAddress: _bootstrapAddress
        })

    // Helper to generate the init code for the smart account
    const generateInitCode = () =>
        getAccountInitCode({
            owner: localOwner.address,
            index,
            validatorAddress,
            bootstrapAddress
        })

    let accountAddress: Address | undefined = address

    let chainId: number

    const getMemoizedChainId = async () => {
        if (chainId) return chainId
        chainId = client.chain
            ? client.chain.id
            : await getAction(client, getChainId, "getChainId")({})
        return chainId
    }

    const getFactoryArgs = async () => {
        return {
            factory: metaFactoryAddress,
            factoryData: await generateInitCode()
        }
    }

    return toSmartAccount({
        client,
        entryPoint,
        getFactoryArgs,
        async getAddress() {
            if (accountAddress) return accountAddress

            const { factory, factoryData } = await getFactoryArgs()

            // Get the sender address based on the init code
            accountAddress = await getSenderAddress(client, {
                factory,
                factoryData,
                entryPointAddress: entryPoint.address
            })

            return accountAddress
        },
        async encodeCalls(calls) {
            return encode7579Calls({
                mode: {
                    type: calls.length > 1 ? "batchcall" : "call",
                    revertOnError: false,
                    selector: "0x",
                    context: "0x"
                },
                callData: calls
            })
        },
        async decodeCalls(callData) {
            return decode7579Calls(callData).callData
        },
        async getNonce(_args) {
            return getAccountNonce(client, {
                address: await this.getAddress(),
                entryPointAddress: entryPoint.address,
                key: getNonceKeyWithEncoding(
                    validatorAddress,
                    /*args?.key ?? */ parameters.nonceKey ?? 0n
                )
            })
        },
        async getStubSignature() {
            return DUMMY_ECDSA_SIGNATURE
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        async signMessage({ message }) {
            let signature: Hex = await localOwner.signMessage({
                message
            })
            const potentiallyIncorrectV = Number.parseInt(
                signature.slice(-2),
                16
            )
            if (![27, 28].includes(potentiallyIncorrectV)) {
                const correctV = potentiallyIncorrectV + 27
                signature = (signature.slice(0, -2) +
                    correctV.toString(16)) as Hex
            }
            return encodePacked(
                ["address", "bytes"],
                [validatorAddress, signature]
            )
        },
        async signTypedData(typedData) {
            let signature: Hex = await localOwner.signTypedData(typedData)

            const potentiallyIncorrectV = Number.parseInt(
                signature.slice(-2),
                16
            )
            if (![27, 28].includes(potentiallyIncorrectV)) {
                const correctV = potentiallyIncorrectV + 27
                signature = (signature.slice(0, -2) +
                    correctV.toString(16)) as Hex
            }

            return encodePacked(
                ["address", "bytes"],
                [validatorAddress, signature]
            )
        },
        async signUserOperation(parameters) {
            const { chainId = await getMemoizedChainId(), ...userOperation } =
                parameters

            const hash = getUserOperationHash({
                userOperation: {
                    ...userOperation,
                    sender: userOperation.sender ?? (await this.getAddress()),
                    signature: "0x"
                } as UserOperation<entryPointVersion>,
                entryPointAddress: entryPoint.address,
                entryPointVersion: entryPoint.version,
                chainId: chainId
            })

            const signature = await localOwner.signMessage({
                message: { raw: hash }
            })

            return signature
        }
    }) as Promise<ToEtherspotSmartAccountReturnType<entryPointVersion>>
}
