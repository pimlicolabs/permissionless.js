import type { Client } from "viem"
import type {
    entryPoint06Abi,
    entryPoint06Address,
    entryPoint07Abi,
    entryPoint07Address
} from "viem/account-abstraction"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { toSimpleSmartAccount } from "../../../permissionless/accounts/simple/toSimpleSmartAccount"

export const getMockAccount = ({
    publicClient,
    entryPoint
}: {
    publicClient: Client
    entryPoint: {
        address: typeof entryPoint06Address | typeof entryPoint07Address
        version: "0.6" | "0.7"
        abi: typeof entryPoint06Abi | typeof entryPoint07Abi
    }
}) => {
    return toSimpleSmartAccount({
        client: publicClient,
        entryPoint,
        owner: privateKeyToAccount(generatePrivateKey())
    })
}
