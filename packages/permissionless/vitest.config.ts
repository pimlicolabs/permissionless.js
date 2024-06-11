import { join } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        alias: {
            permissionless: join(__dirname, "./")
        },
        globalSetup: [join(__dirname, "./setupTests.ts")],
        coverage: {
            all: false,
            provider: "v8",
            reporter: process.env.CI ? ["lcov"] : ["text", "json", "html"],
            exclude: [
                "**/errors/utils.ts",
                "**/*.test.ts",
                "**/permissionless-test/**",
                "**/_cjs/**",
                "**/_esm/**",
                "**/_types/**"
            ]
        },
        sequence: {
            concurrent: true
        },
        fileParallelism: false,
        environment: "node",
        testTimeout: 60_000,
        hookTimeout: 45_000,
        include: [join(__dirname, "./**/*.test.ts")]
    }
})
