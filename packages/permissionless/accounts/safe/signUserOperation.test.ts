import { Account } from "viem"
import { anvil } from "viem/chains"
import type { Hex } from "viem/utils"
import { describe, expect } from "vitest"
import { getSafeClient } from "../../../permissionless-test/src/accounts/safe"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getBundlerClient } from "../../../permissionless-test/src/utils"
import {
    type SignUserOperationParameters,
    signUserOperation
} from "./signUserOperation"

const randomOwners = () => [
    Account.random(),
    Account.random(),
    Account.random()
]

const signWithEveryOwner = async ({
    owners,
    ...parameters
}: Omit<SignUserOperationParameters, "account" | "owners" | "signatures"> & {
    owners: Account.PrivateKey[]
}) => {
    const ownerAddresses = owners.map((owner) => Account.from(owner.address))
    let signature: Hex.Hex | undefined
    for (const owner of owners) {
        signature = await signUserOperation({
            ...parameters,
            owners: ownerAddresses,
            account: owner,
            signatures: signature
        })
    }
    if (!signature) throw new Error("no signature")
    return signature
}

describe("SafeSmartAccount.signUserOperation", () => {
    testWithRpc("signUserOperation_V06", async ({ rpc }) => {
        const owners = randomOwners()
        const client = getBundlerClient({
            account: await getSafeClient({
                ...rpc,
                entryPoint: { version: "0.6" },
                owners: owners.map((owner) => Account.from(owner.address))
            }),
            entryPoint: { version: "0.6" },
            ...rpc
        })

        const userOperation = await client.userOperation.prepare({
            calls: [{ to: client.account.address, data: "0x" }]
        })
        const signature = await signWithEveryOwner({
            ...userOperation,
            entryPoint: "0.6",
            chainId: anvil.id,
            owners
        })

        const receipt = await client.userOperation.waitForReceipt({
            hash: await client.userOperation.send({
                ...userOperation,
                signature
            })
        })
        expect(receipt.success).toBe(true)
    })

    testWithRpc("signUserOperation_V07", async ({ rpc }) => {
        const owners = randomOwners()
        const client = getBundlerClient({
            account: await getSafeClient({
                ...rpc,
                entryPoint: { version: "0.7" },
                owners: owners.map((owner) => Account.from(owner.address))
            }),
            entryPoint: { version: "0.7" },
            ...rpc
        })

        const userOperation = await client.userOperation.prepare({
            calls: [{ to: client.account.address, data: "0x" }]
        })
        const signature = await signWithEveryOwner({
            ...userOperation,
            entryPoint: "0.7",
            chainId: anvil.id,
            owners
        })

        const receipt = await client.userOperation.waitForReceipt({
            hash: await client.userOperation.send({
                ...userOperation,
                signature
            })
        })
        expect(receipt.success).toBe(true)
    })

    testWithRpc("signUserOperation_V07 7579", async ({ rpc }) => {
        const owners = randomOwners()
        const client = getBundlerClient({
            account: await getSafeClient({
                ...rpc,
                entryPoint: { version: "0.7" },
                owners: owners.map((owner) => Account.from(owner.address)),
                erc7579: true
            }),
            entryPoint: { version: "0.7" },
            ...rpc
        })

        const userOperation = await client.userOperation.prepare({
            calls: [{ to: client.account.address, data: "0x" }]
        })
        const signature = await signWithEveryOwner({
            ...userOperation,
            entryPoint: "0.7",
            chainId: anvil.id,
            owners,
            safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002"
        })

        const receipt = await client.userOperation.waitForReceipt({
            hash: await client.userOperation.send({
                ...userOperation,
                signature
            })
        })
        expect(receipt.success).toBe(true)
    })
})
