import { join } from "node:path"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig({
    resolve: {
        alias: {
            "@pimlico/mock-paymaster": join(
                __dirname,
                "../mock-paymaster/index.ts"
            )
        }
    },
    test: {
        coverage: {
            all: true,
            provider: "v8",
            reporter: process.env.CI ? ["lcov"] : ["text", "json", "html"],
            include: ["**/permissionless/**"],
            exclude: [
                "**/errors/utils.ts",
                "**/*.test.ts",
                "**/permissionless-test/**",
                "**/_cjs/**",
                "**/_esm/**",
                "**/_types/**",
                "**/permissionless/accounts/index.ts",
                "**/permissionless/accounts/*/index.ts"
            ]
        },
        sequence: {
            concurrent: false
        },
        fileParallelism: true,
        environment: "node",
        testTimeout: 60_000,
        hookTimeout: 45_000,
        include: [
            join(__dirname, "./**/*.test.ts"),
            join(__dirname, "../permissionless-test/src/fixtures/**/*.test.ts")
        ],
        // Pending the account port tickets (10-17): the account dirs still hold
        // 0.x code, and these action tests need at least one ported account in
        // permissionless-test's getCoreSmartAccounts / getSimpleAccountClient.
        exclude: [
            "**/node_modules/**",
            "**/accounts/**",
            "**/actions/erc7579/*.test.ts",
            "**/actions/smartAccount/*.test.ts",
            "**/actions/public/*.test.ts",
            "**/actions/pimlico/getUserOperationStatus.test.ts",
            "**/actions/pimlico/sponsorUserOperation.test.ts",
            "**/actions/pimlico/validateSponsorshipPolicies.test.ts",
            "**/experimental/**/*.test.ts"
        ],
        env: loadEnv("test", process.cwd())
    }
})
