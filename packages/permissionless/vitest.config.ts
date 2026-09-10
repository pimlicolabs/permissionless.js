import { readFileSync } from "node:fs"
import { join } from "node:path"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

// The smoke test imports the package by its public entrypoints; each maps to
// the source behind the same package.json exports entry. The `./_types/*`
// escape hatch is not an entrypoint.
const { exports } = JSON.parse(
    readFileSync(join(__dirname, "package.json"), "utf8")
) as { exports: Record<string, string | { default: string }> }
const entrypoints = Object.entries(exports).flatMap(([subpath, entry]) =>
    typeof entry === "object" && !subpath.includes("*")
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
            // package.json `files` defines shipped code; everything it
            // negates is out of the denominator, the build output with it.
            exclude: [
                "**/*.test.ts",
                "**/*.test-d.ts",
                "**/*.bench.ts",
                "**/setupTests.ts",
                "**/*.config.ts",
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
        include: [
            join(__dirname, "./**/*.test.ts"),
            join(__dirname, "../permissionless-test/src/fixtures/**/*.test.ts")
        ],
        // *.test-d.ts import the package by its entrypoints, so the whole source is
        // in the program: the repo compiler (TS 7) checks it in ~40s where TS 5.9
        // takes ~260s. CI reruns them on 5.9.3 / 6.0.3 via --typecheck.checker.
        typecheck: {
            enabled: true,
            checker: join(__dirname, "../../node_modules/typescript/bin/tsc"),
            tsconfig: join(
                __dirname,
                "../../tsconfig/tsconfig.permissionless.test-d.json"
            ),
            include: [join(__dirname, "./**/*.test-d.ts")]
        },
        exclude: ["**/node_modules/**"],
        env: loadEnv("test", process.cwd())
    }
})
