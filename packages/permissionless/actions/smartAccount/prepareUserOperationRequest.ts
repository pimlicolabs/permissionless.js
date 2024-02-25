import type { Chain, Client, Transport } from "viem"
import { estimateFeesPerGas } from "viem/actions"
import type { SmartAccount } from "../../accounts/types"
import type {
    GetAccountParameter,
    PartialBy,
    Prettify,
    UserOperation
} from "../../types/"
import type { StateOverrides } from "../../types/bundler"
import type {
    ENTRYPOINT_ADDRESS_V06_TYPE,
    ENTRYPOINT_ADDRESS_V07_TYPE,
    EntryPoint,
    GetEntryPointVersion
} from "../../types/entrypoint"
import { AccountOrClientNotFoundError, parseAccount } from "../../utils/"
import { getAction } from "../../utils/getAction"
import { getEntryPointVersion } from "../../utils/getEntryPointVersion"
import { estimateUserOperationGas } from "../bundler/estimateUserOperationGas"

export type Middleware<entryPoint extends EntryPoint> = {
    middleware?:
        | ((args: {
              userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
              entryPoint: entryPoint
          }) => Promise<UserOperation<GetEntryPointVersion<entryPoint>>>)
        | {
              gasPrice?: () => Promise<{
                  maxFeePerGas: bigint
                  maxPriorityFeePerGas: bigint
              }>
              sponsorUserOperation?: (args: {
                  userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
                  entryPoint: entryPoint
              }) => Promise<
                  entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE
                      ? Pick<
                              UserOperation<"v0.6">,
                              | "callGasLimit"
                              | "verificationGasLimit"
                              | "preVerificationGas"
                              | "paymasterAndData"
                          >
                      : Pick<
                              UserOperation<"v0.7">,
                              | "callGasLimit"
                              | "verificationGasLimit"
                              | "preVerificationGas"
                              | "paymaster"
                              | "paymasterVerificationGasLimit"
                              | "paymasterPostOpGasLimit"
                              | "paymasterData"
                          >
              >
          }
}

export type PrepareUserOperationRequestParameters<
    entryPoint extends EntryPoint,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
> = {
    userOperation: entryPoint extends ENTRYPOINT_ADDRESS_V06_TYPE
        ? PartialBy<
              UserOperation<"v0.6">,
              | "sender"
              | "nonce"
              | "initCode"
              | "callGasLimit"
              | "verificationGasLimit"
              | "preVerificationGas"
              | "maxFeePerGas"
              | "maxPriorityFeePerGas"
              | "paymasterAndData"
              | "signature"
          >
        : PartialBy<
              UserOperation<"v0.7">,
              | "sender"
              | "nonce"
              | "factory"
              | "factoryData"
              | "callGasLimit"
              | "verificationGasLimit"
              | "preVerificationGas"
              | "maxFeePerGas"
              | "maxPriorityFeePerGas"
              | "paymaster"
              | "paymasterVerificationGasLimit"
              | "paymasterPostOpGasLimit"
              | "paymasterData"
              | "signature"
          >
} & GetAccountParameter<entryPoint, TAccount> &
    Middleware<entryPoint>

export type PrepareUserOperationRequestReturnType<
    entryPoint extends EntryPoint
> = UserOperation<GetEntryPointVersion<entryPoint>>

async function prepareUserOperationRequestForEntryPointV06<
    entryPoint extends EntryPoint = ENTRYPOINT_ADDRESS_V06_TYPE,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
>(
    client: Client<TTransport, TChain, TAccount>,
    args: Prettify<PrepareUserOperationRequestParameters<entryPoint, TAccount>>,
    stateOverrides?: StateOverrides
): Promise<Prettify<PrepareUserOperationRequestReturnType<entryPoint>>> {
    const {
        account: account_ = client.account,
        userOperation: partialUserOperation,
        middleware
    } = args
    if (!account_) throw new AccountOrClientNotFoundError()

    const account = parseAccount(
        account_
    ) as SmartAccount<ENTRYPOINT_ADDRESS_V06_TYPE>

    const [sender, nonce, initCode, callData] = await Promise.all([
        partialUserOperation.sender || account.address,
        partialUserOperation.nonce || account.getNonce(),
        partialUserOperation.initCode || account.getInitCode(),
        partialUserOperation.callData
    ])

    const userOperation: UserOperation<"v0.6"> = {
        sender,
        nonce,
        initCode,
        callData,
        paymasterAndData: "0x",
        signature: partialUserOperation.signature || "0x",
        maxFeePerGas: partialUserOperation.maxFeePerGas || 0n,
        maxPriorityFeePerGas: partialUserOperation.maxPriorityFeePerGas || 0n,
        callGasLimit: partialUserOperation.callGasLimit || 0n,
        verificationGasLimit: partialUserOperation.verificationGasLimit || 0n,
        preVerificationGas: partialUserOperation.preVerificationGas || 0n
    }

    if (userOperation.signature === "0x") {
        userOperation.signature = await account.getDummySignature(userOperation)
    }

    if (typeof middleware === "function") {
        return (await middleware({
            userOperation,
            entryPoint: account.entryPoint
        } as {
            userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
            entryPoint: entryPoint
        })) as PrepareUserOperationRequestReturnType<entryPoint>
    }

    if (middleware && typeof middleware !== "function" && middleware.gasPrice) {
        const gasPrice = await middleware.gasPrice()
        userOperation.maxFeePerGas = gasPrice.maxFeePerGas
        userOperation.maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas
    }

    if (!userOperation.maxFeePerGas || !userOperation.maxPriorityFeePerGas) {
        const estimateGas = await estimateFeesPerGas(account.client)
        userOperation.maxFeePerGas =
            userOperation.maxFeePerGas || estimateGas.maxFeePerGas
        userOperation.maxPriorityFeePerGas =
            userOperation.maxPriorityFeePerGas ||
            estimateGas.maxPriorityFeePerGas
    }

    if (
        middleware &&
        typeof middleware !== "function" &&
        middleware.sponsorUserOperation
    ) {
        const sponsorUserOperationData = (await middleware.sponsorUserOperation(
            {
                userOperation,
                entryPoint: account.entryPoint
            } as {
                userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
                entryPoint: entryPoint
            }
        )) as Pick<
            UserOperation<"v0.6">,
            | "callGasLimit"
            | "verificationGasLimit"
            | "preVerificationGas"
            | "paymasterAndData"
        >

        userOperation.callGasLimit = sponsorUserOperationData.callGasLimit
        userOperation.verificationGasLimit =
            sponsorUserOperationData.verificationGasLimit
        userOperation.preVerificationGas =
            sponsorUserOperationData.preVerificationGas
        userOperation.paymasterAndData =
            sponsorUserOperationData.paymasterAndData
    }

    if (
        !userOperation.callGasLimit ||
        !userOperation.verificationGasLimit ||
        !userOperation.preVerificationGas
    ) {
        const gasParameters = await getAction(client, estimateUserOperationGas)(
            {
                userOperation,
                entryPoint: account.entryPoint
            } as {
                userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
                entryPoint: entryPoint
            },
            stateOverrides
        )

        userOperation.callGasLimit |= gasParameters.callGasLimit
        userOperation.verificationGasLimit =
            userOperation.verificationGasLimit ||
            gasParameters.verificationGasLimit
        userOperation.preVerificationGas =
            userOperation.preVerificationGas || gasParameters.preVerificationGas
    }

    return userOperation as PrepareUserOperationRequestReturnType<entryPoint>
}

async function prepareUserOperationRequestEntryPointV07<
    entryPoint extends EntryPoint = ENTRYPOINT_ADDRESS_V07_TYPE,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
>(
    client: Client<TTransport, TChain, TAccount>,
    args: Prettify<PrepareUserOperationRequestParameters<entryPoint, TAccount>>,
    stateOverrides?: StateOverrides
): Promise<Prettify<PrepareUserOperationRequestReturnType<entryPoint>>> {
    const {
        account: account_ = client.account,
        userOperation: partialUserOperation,
        middleware
    } = args
    if (!account_) throw new AccountOrClientNotFoundError()

    const account = parseAccount(
        account_
    ) as SmartAccount<ENTRYPOINT_ADDRESS_V07_TYPE>

    const [sender, nonce, factory, factoryData, callData, gasEstimation] =
        await Promise.all([
            partialUserOperation.sender || account.address,
            partialUserOperation.nonce || account.getNonce(),
            partialUserOperation.factory || account.getFactory(),
            partialUserOperation.factoryData || account.getFactoryData(),
            partialUserOperation.callData,
            !partialUserOperation.maxFeePerGas ||
            !partialUserOperation.maxPriorityFeePerGas
                ? estimateFeesPerGas(account.client)
                : undefined
        ])

    const userOperation: UserOperation<"v0.7"> = {
        sender,
        nonce,
        factory: factory || undefined,
        factoryData: factoryData || undefined,
        callData,
        callGasLimit: partialUserOperation.callGasLimit || 0n,
        verificationGasLimit: partialUserOperation.verificationGasLimit || 0n,
        preVerificationGas: partialUserOperation.preVerificationGas || 0n,
        maxFeePerGas:
            partialUserOperation.maxFeePerGas ||
            gasEstimation?.maxFeePerGas ||
            0n,
        maxPriorityFeePerGas:
            partialUserOperation.maxPriorityFeePerGas ||
            gasEstimation?.maxPriorityFeePerGas ||
            0n,
        paymaster: undefined,
        paymasterVerificationGasLimit: undefined,
        paymasterPostOpGasLimit: undefined,
        paymasterData: undefined,
        signature: partialUserOperation.signature || "0x"
    }

    if (userOperation.signature === "0x") {
        userOperation.signature = await account.getDummySignature(userOperation)
    }

    if (typeof middleware === "function") {
        return (await middleware({
            userOperation,
            entryPoint: account.entryPoint
        } as {
            userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
            entryPoint: entryPoint
        })) as PrepareUserOperationRequestReturnType<entryPoint>
    }

    if (
        middleware &&
        typeof middleware !== "function" &&
        middleware.sponsorUserOperation
    ) {
        const sponsorUserOperationData = (await middleware.sponsorUserOperation(
            {
                userOperation,
                entryPoint: account.entryPoint
            } as {
                userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
                entryPoint: entryPoint
            }
        )) as Pick<
            UserOperation<"v0.7">,
            | "callGasLimit"
            | "verificationGasLimit"
            | "preVerificationGas"
            | "paymaster"
            | "paymasterVerificationGasLimit"
            | "paymasterPostOpGasLimit"
            | "paymasterData"
        >
        userOperation.callGasLimit = sponsorUserOperationData.callGasLimit
        userOperation.verificationGasLimit =
            sponsorUserOperationData.verificationGasLimit
        userOperation.preVerificationGas =
            sponsorUserOperationData.preVerificationGas
        userOperation.paymaster = sponsorUserOperationData.paymaster
        userOperation.paymasterVerificationGasLimit =
            sponsorUserOperationData.paymasterVerificationGasLimit
        userOperation.paymasterPostOpGasLimit =
            sponsorUserOperationData.paymasterPostOpGasLimit
        userOperation.paymasterData = sponsorUserOperationData.paymasterData
    }

    if (middleware && typeof middleware !== "function" && middleware.gasPrice) {
        const gasPrice = await middleware.gasPrice()
        userOperation.maxFeePerGas = gasPrice.maxFeePerGas
        userOperation.maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas
    }

    if (!userOperation.maxFeePerGas || !userOperation.maxPriorityFeePerGas) {
        const estimateGas = await estimateFeesPerGas(account.client)
        userOperation.maxFeePerGas =
            userOperation.maxFeePerGas || estimateGas.maxFeePerGas
        userOperation.maxPriorityFeePerGas =
            userOperation.maxPriorityFeePerGas ||
            estimateGas.maxPriorityFeePerGas
    }

    if (
        !userOperation.callGasLimit ||
        !userOperation.verificationGasLimit ||
        !userOperation.preVerificationGas
    ) {
        const gasParameters = await getAction(client, estimateUserOperationGas)(
            {
                userOperation,
                entryPoint: account.entryPoint
            } as {
                userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
                entryPoint: entryPoint
            },
            stateOverrides
        )

        userOperation.callGasLimit |= gasParameters.callGasLimit
        userOperation.verificationGasLimit =
            userOperation.verificationGasLimit ||
            gasParameters.verificationGasLimit
        userOperation.preVerificationGas =
            userOperation.preVerificationGas || gasParameters.preVerificationGas
    }

    return userOperation as PrepareUserOperationRequestReturnType<entryPoint>
}

export async function prepareUserOperationRequest<
    entryPoint extends EntryPoint,
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends SmartAccount<entryPoint> | undefined =
        | SmartAccount<entryPoint>
        | undefined
>(
    client: Client<TTransport, TChain, TAccount>,
    args: Prettify<PrepareUserOperationRequestParameters<entryPoint, TAccount>>,
    stateOverrides?: StateOverrides
): Promise<Prettify<PrepareUserOperationRequestReturnType<entryPoint>>> {
    const { account: account_ = client.account } = args
    if (!account_) throw new AccountOrClientNotFoundError()

    const account = parseAccount(account_) as SmartAccount<entryPoint>

    const entryPointVersion = getEntryPointVersion(account.entryPoint)

    if (entryPointVersion === "v0.6") {
        return prepareUserOperationRequestForEntryPointV06(
            client,
            args,
            stateOverrides
        ) as Promise<PrepareUserOperationRequestReturnType<entryPoint>>
    }

    return prepareUserOperationRequestEntryPointV07(
        client,
        args,
        stateOverrides
    ) as Promise<PrepareUserOperationRequestReturnType<entryPoint>>
}
