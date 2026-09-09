import { existsSync, readdirSync, readFileSync } from "node:fs"
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

// The smoke test imports the package by its public entrypoints; each maps to
// the source behind the same package.json exports entry.
const { exports } = JSON.parse(
    readFileSync(join(__dirname, "package.json"), "utf8")
) as { exports: Record<string, string | { default: string }> }
const entrypoints = Object.entries(exports).flatMap(([subpath, entry]) =>
    typeof entry === "object"
        ? [
              {
                  find: new RegExp(`^permissionless${subpath.slice(1)}$`),
                  replacement: join(
                      __dirname,
                      entry.default
                          .replace("./_esm/", "")
                          .replace(/\.js$/, ".ts")
                  )
              }
          ]
        : []
)

export default defineConfig({
    resolve: {
        alias: [
            ...entrypoints,
            {
                find: "@pimlico/mock-paymaster",
                replacement: join(__dirname, "../mock-paymaster/index.ts")
            }
        ]
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
        // *.test-d.ts run through TS 5.9 (typescript5): TS 7 has no JS API for vitest to drive.
        typecheck: {
            enabled: true,
            checker: join(__dirname, "../../node_modules/typescript5/bin/tsc"),
            tsconfig: join(
                __dirname,
                "../../tsconfig/tsconfig.permissionless.test-d.json"
            ),
            include: [join(__dirname, "./**/*.test-d.ts")]
        },
        // Pending the account port tickets (10-17): the account dirs still hold
        // 0.x code, and these action tests need at least one ported account in
        // permissionless-test's getCoreSmartAccounts / getSimpleAccountClient.
        exclude: [
            "**/node_modules/**",
            ...unportedAccounts,
            "**/accounts/*.test.ts",
            "**/actions/erc7579/*.test.ts",
            "**/actions/smartAccount/*.test.ts",
            "**/actions/public/*.test.ts",
            "**/actions/pimlico/getUserOperationStatus.test.ts",
            "**/actions/pimlico/sponsorUserOperation.test.ts",
            "**/actions/pimlico/validateSponsorshipPolicies.test.ts",
            "**/actions/erc20Paymaster/prepareUserOperation.test.ts"
        ],
        env: loadEnv("test", process.cwd())
    }
})
