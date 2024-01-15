import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        benchmark: {
            outputFile: "./bench/report.json",
            reporters: process.env.CI ? ["json"] : ["verbose"]
        },
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
            concurrent: false
        },
        fileParallelism: false,
        environment: "node",
        testTimeout: 10_000
    }
})
