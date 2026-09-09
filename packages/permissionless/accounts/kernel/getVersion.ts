import { Actions, type Client } from "viem"
import type { Address } from "viem/utils"
import { InvalidKernelAccountError } from "../../errors/kernel.js"
import { getAction } from "../../utils/getAction.js"
import { KernelV3AccountAbi } from "./abi/KernelV3AccountAbi.js"
import { type Version, versions } from "./version.js"

export type GetVersionParameters = { address: Address.Address }

const known: readonly string[] = Object.values(versions).flat()

export async function getVersion(
    client: Client.Client,
    { address }: GetVersionParameters
): Promise<Version | null> {
    const code = await getAction(
        client,
        Actions.address.getCode,
        "address.getCode"
    )({ address })
    if (!code) return null
    const { name, version } = await getAction(
        client,
        Actions.contract.read,
        "contract.read"
    )({
        address,
        abi: KernelV3AccountAbi,
        functionName: "eip712Domain"
    }).catch((cause: Error) => {
        throw new InvalidKernelAccountError({ address, cause })
    })
    if (name !== "Kernel" || !known.includes(version))
        throw new InvalidKernelAccountError({ address })
    return version as Version
}
