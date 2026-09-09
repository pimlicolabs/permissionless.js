import { describe, expect, test } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import { getCoreSmartAccounts } from "../../../permissionless-test/src/utils"
import { Erc7579InvalidModuleTypeError } from "../../errors/erc7579"
import {
    type ModuleType,
    parseModuleTypeId,
    supportsModule
} from "./supportsModule"

describe.each(getCoreSmartAccounts())(
    "supportsModule $name",
    ({ getErc7579SmartAccountClient }) => {
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "supportsModule",
            async ({ rpc }) => {
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const smartClient = await getErc7579SmartAccountClient({
                    entryPoint: {
                        version: "0.7"
                    },
                    ...rpc
                })

                const supportsValidationModule = await supportsModule(
                    smartClient,
                    {
                        account: smartClient.account,
                        type: "validator"
                    }
                )

                expect(supportsValidationModule).toBe(true)
            }
        )
    }
)

describe("parseModuleTypeId", () => {
    test("maps the four ERC-7579 module types", () => {
        expect(
            (["validator", "executor", "fallback", "hook"] as const).map(
                parseModuleTypeId
            )
        ).toEqual([1n, 2n, 3n, 4n])
    })

    test("throws Erc7579InvalidModuleTypeError otherwise", () => {
        expect(() => parseModuleTypeId("bogus" as ModuleType)).toThrow(
            Erc7579InvalidModuleTypeError
        )
    })
})
