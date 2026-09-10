import { type Account, Actions, type Chain, type Client } from "viem"
import { SmartAccount, UserOperation, type WebAuthnAccount } from "viem/erc4337"
import {
    AbiFunction,
    AbiParameters,
    type Address,
    Hash,
    Hex,
    PublicKey,
    type TypedData
} from "viem/utils"
import { getSenderAddress } from "../../actions/public/getSenderAddress.js"
import {
    KernelUnsupportedVersionError,
    KernelValidatorAddressRequiredError
} from "../../errors/kernel.js"
import type { Assign, OneOf } from "../../types/utils.js"
import { toBytes } from "../../utils/base64.js"
import { getAction } from "../../utils/getAction.js"
import {
    type EntryPointAbi,
    type EntryPointParameter,
    toEntryPoint
} from "../../utils/toEntryPoint.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"
import { withNonceKey } from "../../utils/withNonceKey.js"
import { KernelInitAbi } from "./abi/KernelAccountAbi.js"
import {
    KernelV3_1AccountAbi,
    KernelV3InitAbi
} from "./abi/KernelV3AccountAbi.js"
import { KernelV3FactoryAbi } from "./abi/KernelV3FactoryAbi.js"
import { KernelV3MetaFactoryDeployWithFactoryAbi } from "./abi/KernelV3MetaFactoryAbi.js"
import {
    DUMMY_ECDSA_SIGNATURE,
    ROOT_MODE_KERNEL_V2,
    VALIDATOR_TYPE
} from "./constants.js"
import { decodeCallData } from "./utils/decodeCallData.js"
import { encodeCallData } from "./utils/encodeCallData.js"
import { getNonceKeyWithEncoding } from "./utils/getNonceKey.js"
import { isWebAuthnAccount } from "./utils/isWebAuthnAccount.js"
import {
    signHash,
    signWebAuthn,
    webAuthnSignatureParameters
} from "./utils/signHash.js"
import { signMessage } from "./utils/signMessage.js"
import { signTypedData } from "./utils/signTypedData.js"
import {
    type EntryPointVersion,
    isKernelV2,
    type Version,
    versions
} from "./version.js"

type WalletClient = Client.Client<Chain.Chain | undefined, Account.Account>

type Owner = OneOf<
    EthereumProvider | WalletClient | Account.Local | WebAuthnAccount.Account
>

export type Parameters<
    entryPointVersion extends EntryPointVersion = "0.7",
    eip7702 extends boolean = false
> = {
    address?: Address.Address | undefined
    client: Client.Client
    eip7702?: eip7702 | undefined
    entryPoint?: EntryPointParameter<entryPointVersion> | undefined
    factoryAddress?: Address.Address | undefined
    implementation?: Address.Address | undefined
    index?: bigint | undefined
    metaFactoryAddress?: Address.Address | undefined
    nonceKey?: bigint | undefined
    owner: Owner
    useMetaFactory?: boolean | "optional" | undefined
    validatorAddress?: Address.Address | undefined
    version?: Version<entryPointVersion> | undefined
}

export type Implementation<
    entryPointVersion extends EntryPointVersion = "0.7",
    eip7702 extends boolean = false
> = Assign<
    SmartAccount.Implementation<
        EntryPointAbi<entryPointVersion>,
        entryPointVersion,
        eip7702 extends true ? { implementation: Address.Address } : object,
        eip7702
    >,
    { sign: NonNullable<SmartAccount.Implementation["sign"]> }
>

export type ReturnType<
    entryPointVersion extends EntryPointVersion = "0.7",
    eip7702 extends boolean = false
> = SmartAccount.SmartAccount<Implementation<entryPointVersion, eip7702>>

const zeroAddress = "0x0000000000000000000000000000000000000000"

const createAccountAbi = [
    {
        inputs: [
            { name: "_implementation", type: "address" },
            { name: "_data", type: "bytes" },
            { name: "_index", type: "uint256" }
        ],
        name: "createAccount",
        outputs: [{ name: "proxy", type: "address" }],
        stateMutability: "payable",
        type: "function"
    }
] as const

const addresses: Record<
    Version,
    {
        ECDSA_VALIDATOR: Address.Address
        WEB_AUTHN_VALIDATOR?: Address.Address
        ACCOUNT_LOGIC: Address.Address
        FACTORY_ADDRESS: Address.Address
        META_FACTORY_ADDRESS?: Address.Address
    }
> = {
    "0.2.1": {
        ECDSA_VALIDATOR: "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390",
        ACCOUNT_LOGIC: "0xf048AD83CB2dfd6037A43902a2A5Be04e53cd2Eb",
        FACTORY_ADDRESS: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3"
    },
    "0.2.2": {
        ECDSA_VALIDATOR: "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390",
        ACCOUNT_LOGIC: "0x0DA6a956B9488eD4dd761E59f52FDc6c8068E6B5",
        FACTORY_ADDRESS: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3"
    },
    "0.2.3": {
        ECDSA_VALIDATOR: "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390",
        ACCOUNT_LOGIC: "0xD3F582F6B4814E989Ee8E96bc3175320B5A540ab",
        FACTORY_ADDRESS: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3"
    },
    "0.2.4": {
        ECDSA_VALIDATOR: "0xd9AB5096a832b9ce79914329DAEE236f8Eea0390",
        ACCOUNT_LOGIC: "0xd3082872F8B06073A021b4602e022d5A070d7cfC",
        FACTORY_ADDRESS: "0x5de4839a76cf55d0c90e2061ef4386d962E15ae3"
    },
    "0.3.0-beta": {
        ECDSA_VALIDATOR: "0x8104e3Ad430EA6d354d013A6789fDFc71E671c43",
        ACCOUNT_LOGIC: "0x94F097E1ebEB4ecA3AAE54cabb08905B239A7D27",
        FACTORY_ADDRESS: "0x6723b44Abeec4E71eBE3232BD5B455805baDD22f",
        META_FACTORY_ADDRESS: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5",
        WEB_AUTHN_VALIDATOR: "0x7ab16Ff354AcB328452F1D445b3Ddee9a91e9e69"
    },
    "0.3.1": {
        ECDSA_VALIDATOR: "0x845ADb2C711129d4f3966735eD98a9F09fC4cE57",
        ACCOUNT_LOGIC: "0xBAC849bB641841b44E965fB01A4Bf5F074f84b4D",
        FACTORY_ADDRESS: "0xaac5D4240AF87249B3f71BC8E4A2cae074A3E419",
        META_FACTORY_ADDRESS: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5",
        WEB_AUTHN_VALIDATOR: "0x7ab16Ff354AcB328452F1D445b3Ddee9a91e9e69"
    },
    "0.3.2": {
        ECDSA_VALIDATOR: "0x845ADb2C711129d4f3966735eD98a9F09fC4cE57",
        ACCOUNT_LOGIC: "0xD830D15D3dc0C269F3dBAa0F3e8626d33CFdaBe1",
        FACTORY_ADDRESS: "0x7a1dBAB750f12a90EB1B60D2Ae3aD17D4D81EfFe",
        META_FACTORY_ADDRESS: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5"
    },
    "0.3.3": {
        ECDSA_VALIDATOR: "0x845ADb2C711129d4f3966735eD98a9F09fC4cE57",
        ACCOUNT_LOGIC: "0xd6CEDDe84be40893d153Be9d467CD6aD37875b28",
        FACTORY_ADDRESS: "0x2577507b78c2008Ff367261CB6285d44ba5eF2E9",
        META_FACTORY_ADDRESS: "0xd703aaE79538628d27099B8c4f621bE4CCd142d5"
    }
}

const webAuthnStubSignature = AbiParameters.encode(
    webAuthnSignatureParameters,
    [
        "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d00000000",
        '{"type":"webauthn.get","challenge":"tbxXNFS9X_4Byr1cMwqKrIGB-_30a0QhZ6y7ucM0BOE","origin":"http://localhost:3000","crossOrigin":false, "other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"}',
        1n,
        44941127272049826721201904734628716258498742255959991581049806490182030242267n,
        9910254599581058084911561569808925251374718953855182016200087235935345969636n,
        false
    ]
)

const getRootIdentifier = (
    validatorAddress: Address.Address,
    eip7702 = false
) =>
    Hex.concat(
        eip7702 ? VALIDATOR_TYPE.EIP7702 : VALIDATOR_TYPE.VALIDATOR,
        eip7702 ? "0x" : validatorAddress
    )

const getValidatorData = (owner: Account.Local | WebAuthnAccount.Account) => {
    if (owner.type === "local") return owner.address
    const { x, y } = PublicKey.fromHex(owner.publicKey)
    return AbiParameters.encode(
        [
            {
                components: [
                    { name: "x", type: "uint256" },
                    { name: "y", type: "uint256" }
                ],
                name: "webAuthnData",
                type: "tuple"
            },
            { name: "authenticatorIdHash", type: "bytes32" }
        ],
        [
            { x: Hex.toBigInt(x), y: Hex.toBigInt(y) },
            Hash.keccak256(toBytes(owner.id), { as: "Hex" })
        ]
    )
}

const getInitializationData = ({
    entryPointVersion,
    version,
    validatorAddress,
    validatorData
}: {
    entryPointVersion: EntryPointVersion
    version: Version
    validatorAddress: Address.Address
    validatorData: Hex.Hex
}) => {
    if (entryPointVersion === "0.6")
        return AbiFunction.encodeData(KernelInitAbi, "initialize", [
            validatorAddress,
            validatorData
        ])
    if (version === "0.3.0-beta")
        return AbiFunction.encodeData(KernelV3InitAbi, "initialize", [
            getRootIdentifier(validatorAddress),
            zeroAddress,
            validatorData,
            "0x"
        ])
    return AbiFunction.encodeData(KernelV3_1AccountAbi, "initialize", [
        getRootIdentifier(validatorAddress),
        zeroAddress,
        validatorData,
        "0x",
        []
    ])
}

export async function from<
    entryPointVersion extends EntryPointVersion = "0.7",
    eip7702 extends boolean = false
>(
    parameters: Parameters<entryPointVersion, eip7702>
): Promise<ReturnType<entryPointVersion, eip7702>> {
    const {
        client,
        address,
        index = 0n,
        nonceKey = 0n,
        useMetaFactory = true,
        eip7702 = false
    } = parameters
    const owner = isWebAuthnAccount(parameters.owner)
        ? parameters.owner
        : await toOwner({
              owner: parameters.owner as OneOf<
                  EthereumProvider | WalletClient | Account.Local
              >
          })
    const entryPoint = toEntryPoint(
        (parameters.entryPoint ??
            "0.7") as EntryPointParameter<entryPointVersion>
    )
    const version: Version = eip7702
        ? "0.3.3"
        : (parameters.version ??
          (entryPoint.version === "0.6" ? "0.2.2" : "0.3.0-beta"))
    if (
        !(
            versions[entryPoint.version] as readonly string[] | undefined
        )?.includes(version)
    )
        throw new KernelUnsupportedVersionError({
            version,
            entryPointVersion: entryPoint.version
        })
    const defaults = addresses[version]
    const validatorAddress =
        parameters.validatorAddress ??
        (owner.type === "webAuthn"
            ? defaults.WEB_AUTHN_VALIDATOR
            : defaults.ECDSA_VALIDATOR)
    if (!validatorAddress)
        throw new KernelValidatorAddressRequiredError({ version })
    const implementation = parameters.implementation ?? defaults.ACCOUNT_LOGIC
    const factoryAddress = parameters.factoryAddress ?? defaults.FACTORY_ADDRESS
    const metaFactoryAddress =
        parameters.metaFactoryAddress ??
        defaults.META_FACTORY_ADDRESS ??
        zeroAddress

    const getFactoryArgsFor = (useMetaFactory: boolean) => () => {
        const initializationData = getInitializationData({
            entryPointVersion: entryPoint.version,
            version,
            validatorAddress,
            validatorData: getValidatorData(owner)
        })
        if (entryPoint.version === "0.6")
            return {
                factory: factoryAddress,
                factoryData: AbiFunction.encodeData(
                    createAccountAbi,
                    "createAccount",
                    [implementation, initializationData, index]
                )
            }
        if (!useMetaFactory)
            return {
                factory: factoryAddress,
                factoryData: AbiFunction.encodeData(
                    KernelV3FactoryAbi,
                    "createAccount",
                    [initializationData, Hex.fromNumber(index, { size: 32 })]
                )
            }
        return {
            factory: metaFactoryAddress,
            factoryData: AbiFunction.encodeData(
                KernelV3MetaFactoryDeployWithFactoryAbi,
                "deployWithFactory",
                [
                    factoryAddress,
                    initializationData,
                    Hex.fromNumber(index, { size: 32 })
                ]
            )
        }
    }

    const { accountAddress, getFactoryArgs } = await (async () => {
        if (eip7702)
            return {
                accountAddress: (owner as Account.Local).address,
                getFactoryArgs: () => ({
                    factory: undefined,
                    factoryData: undefined
                })
            }
        let getFactoryArgs = getFactoryArgsFor(useMetaFactory !== false)
        if (address && useMetaFactory !== "optional")
            return { accountAddress: address, getFactoryArgs }
        const getSender = () =>
            getSenderAddress(client, {
                ...getFactoryArgs(),
                entryPointAddress: entryPoint.address
            })
        let accountAddress = await getSender()
        if (
            useMetaFactory === "optional" &&
            address !== accountAddress &&
            accountAddress === zeroAddress
        ) {
            getFactoryArgs = getFactoryArgsFor(false)
            accountAddress = await getSender()
        }
        return { accountAddress, getFactoryArgs }
    })()

    let chainId: number | undefined
    const getChainId = async () => {
        chainId ??=
            client.chain?.id ??
            (await getAction(
                client,
                Actions.chains.getId,
                "chains.getId"
            )(undefined))
        return chainId
    }

    const wrapSignature = (signature: Hex.Hex) =>
        isKernelV2(version)
            ? signature
            : Hex.concat(
                  getRootIdentifier(validatorAddress, eip7702),
                  signature
              )

    const signer = async () => ({
        owner,
        address: accountAddress,
        version,
        chainId: await getChainId(),
        eip7702
    })

    const account = await SmartAccount.from({
        client,
        entryPoint,
        extend: eip7702 ? { implementation } : undefined,
        authorization: eip7702
            ? {
                  account: owner as Account.PrivateKey,
                  address: implementation
              }
            : undefined,
        getAddress: () => accountAddress,
        getFactoryArgs,
        encodeCalls: (calls) => encodeCallData({ calls, version }),
        decodeCalls: (callData) => decodeCallData({ callData, version }),
        getStubSignature: () => {
            if (isKernelV2(version))
                return Hex.concat(ROOT_MODE_KERNEL_V2, DUMMY_ECDSA_SIGNATURE)
            if (owner.type === "webAuthn") return webAuthnStubSignature
            return DUMMY_ECDSA_SIGNATURE
        },
        sign: async ({ hash }) =>
            wrapSignature(await signHash({ hash, ...(await signer()) })),
        signMessage: async ({ message }) =>
            wrapSignature(await signMessage({ message, ...(await signer()) })),
        signTypedData: async (typedData) =>
            wrapSignature(
                await signTypedData({
                    typedData: typedData as TypedData.Definition,
                    ...(await signer())
                })
            ),
        async signUserOperation(parameters) {
            const { chainId = await getChainId(), ...userOperation } =
                parameters
            const hash = UserOperation.hash(
                {
                    ...userOperation,
                    sender: userOperation.sender ?? accountAddress,
                    signature: "0x"
                } as UserOperation.UserOperation<entryPointVersion>,
                {
                    chainId,
                    entryPointAddress: entryPoint.address,
                    entryPointVersion: entryPoint.version
                }
            )
            const signature =
                owner.type === "webAuthn"
                    ? await signWebAuthn(owner, hash)
                    : await owner.signMessage({ message: { raw: hash } })
            return isKernelV2(version)
                ? Hex.concat(ROOT_MODE_KERNEL_V2, signature)
                : signature
        }
    })

    return withNonceKey(account, {
        nonceKey,
        encodeKey: (key) =>
            getNonceKeyWithEncoding(version, validatorAddress, key)
    }) as unknown as ReturnType<entryPointVersion, eip7702>
}
