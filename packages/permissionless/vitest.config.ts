import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

// Accounts still carrying an UNPORTED.md marker (viem 3 port in flight) are kept out of the run.
const accountsDir = join(__dirname, "accounts")
const unportedAccounts = readdirSync(accountsDir, { withFileTypes: true })
    .filter(
        (d) =>
            d.isDirectory() &&
            existsSync(join(accountsDir, d.name, "UNPORTED.md"))
    )
    .map((d) => `**/accounts/${d.name}/**`)

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
        exclude: ["**/node_modules/**", ...unportedAccounts],
        env: loadEnv("test", process.cwd())
    }
})
