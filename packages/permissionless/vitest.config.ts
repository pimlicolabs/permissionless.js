import { join } from "node:path"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig({
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
                "**/_types/**"
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
