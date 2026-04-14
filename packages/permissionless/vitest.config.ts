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
                "**/permissionless/types/**",
                "**/permissionless/vitest.config.ts",
                "**/permissionless/index.ts",
                "**/permissionless/clients/index.ts",
                "**/permissionless/actions/index.ts",
                "**/permissionless/actions/etherspot.ts",
                "**/permissionless/actions/passkeyServer.ts",
                "**/permissionless/actions/smartAccount.ts",
                "**/permissionless/experimental/pimlico/index.ts",
                "**/permissionless/accounts/safe/index.ts"
            ]
        },
        sequence: {
            concurrent: false
        },
        fileParallelism: true,
        environment: "node",
        testTimeout: 60_000,
        hookTimeout: 45_000,
        include: [join(__dirname, "./**/*.test.ts")],
        env: loadEnv("test", process.cwd())
    }
})
