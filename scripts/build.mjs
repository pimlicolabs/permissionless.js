#!/usr/bin/env bun
import { resolve } from "node:path"
import { Glob } from "bun"
import { build } from "esbuild"

const ROOT = resolve(import.meta.dir, "..")

// Each target mirrors the equivalent tsconfig in /tsconfig.
// We hand-list them here because esbuild only needs a handful of fields and
// tsconfig.json's JSONC + trailing-commas would otherwise force a real parser.
const TARGETS = {
    "permissionless-cjs": {
        srcDir: "packages/permissionless",
        outDir: "packages/permissionless/_cjs",
        format: "cjs",
        excludeSuffixes: [
            ".test.ts",
            ".test-d.ts",
            ".bench.ts",
            "setupTests.ts",
            "vitest.config.ts"
        ]
    },
    "permissionless-esm": {
        srcDir: "packages/permissionless",
        outDir: "packages/permissionless/_esm",
        format: "esm",
        excludeSuffixes: [
            ".test.ts",
            ".test-d.ts",
            ".bench.ts",
            "setupTests.ts",
            "vitest.config.ts"
        ]
    },
    "wagmi-esm": {
        srcDir: "packages/wagmi",
        outDir: "packages/wagmi/_esm",
        format: "esm",
        jsx: "automatic",
        excludeSuffixes: [".test.ts", ".test-d.ts", ".bench.ts"]
    },
    "mock-paymaster-cjs": {
        srcDir: "packages/mock-paymaster",
        outDir: "packages/mock-paymaster/_cjs",
        format: "cjs",
        excludeSuffixes: [
            ".test.ts",
            ".test-d.ts",
            ".bench.ts",
            "setupTests.ts"
        ]
    },
    "mock-paymaster-esm": {
        srcDir: "packages/mock-paymaster",
        outDir: "packages/mock-paymaster/_esm",
        format: "esm",
        excludeSuffixes: [
            ".test.ts",
            ".test-d.ts",
            ".bench.ts",
            "setupTests.ts"
        ]
    }
}

const targetName = process.argv[2]
const target = TARGETS[targetName]
if (!target) {
    console.error(
        `usage: bun scripts/build.mjs <target>\n  targets: ${Object.keys(TARGETS).join(", ")}`
    )
    process.exit(1)
}

const srcDir = resolve(ROOT, target.srcDir)
const outDir = resolve(ROOT, target.outDir)

const entryPoints = []
const glob = new Glob("**/*.{ts,tsx}")
for await (const f of glob.scan({ cwd: srcDir, absolute: true })) {
    if (f.endsWith(".d.ts")) continue
    if (target.excludeSuffixes.some((s) => f.endsWith(s))) continue
    if (f.includes("/node_modules/")) continue
    if (f.includes("/_esm/") || f.includes("/_cjs/") || f.includes("/_types/"))
        continue
    entryPoints.push(f)
}

if (entryPoints.length === 0) {
    console.error(`no entry points found for target ${targetName}`)
    process.exit(1)
}

await build({
    entryPoints,
    outdir: outDir,
    outbase: srcDir,
    format: target.format,
    platform: "node",
    target: "es2021",
    bundle: false,
    sourcemap: true,
    sourcesContent: false,
    jsx: target.jsx ?? "preserve",
    tsconfigRaw: {
        compilerOptions: {
            target: "es2021",
            useDefineForClassFields: true,
            verbatimModuleSyntax: target.format === "esm"
        }
    },
    logLevel: "warning"
})
