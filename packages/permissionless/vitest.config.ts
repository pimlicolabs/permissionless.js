import { join } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        globalSetup: [join(__dirname, "./setupTests.ts")],
        coverage: {
            all: false,
            provider: "v8",
            reporter: process.env.CI ? ["lcov"] : ["text", "json", "html"],
            exclude: [
                "**/errors/utils.ts",
                "**/_cjs/**",
                "**/_esm/**",
                "**/_types/**"
            ]
        },
        sequence: {
            concurrent: true
        },
        fileParallelism: true,
        environment: "node",
        testTimeout: 60_000,
        hookTimeout: 45_000,
        include: [join(__dirname, "./**/*.test.ts")]
    }
})
