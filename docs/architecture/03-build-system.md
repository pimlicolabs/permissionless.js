# Build System

The permissionless monorepo uses TypeScript compilation (no bundler) to produce three output formats per package: CommonJS, ES Modules, and TypeScript declaration files.

## Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | ^5.2.2 | Type checking and compilation |
| tsgo | @typescript/native-preview ^7.0.0 | Fast native TypeScript compiler (used for default builds) |
| tsc-alias | ^1.8.8 | Resolves full paths in ESM and types output (adds `.js` extensions) |
| Biome | ^1.0.0 | Linter and formatter (replaces ESLint/Prettier) |
| Vitest | ^2.1.5 | Test runner with coverage-v8 |
| Changesets | ^2.26.2 | Version management and changelog generation |
| size-limit | ^9.0.0 | Bundle size tracking |
| simple-git-hooks | ^2.9.0 | Pre-commit hook runner |
| bun | (runtime) | Package manager and script runner |

## Build Pipeline

Each package produces three output directories:

```
packages/permissionless/
  _cjs/      CommonJS output (module: commonjs, moduleResolution: Node)
  _esm/      ES Module output (module: NodeNext, moduleResolution: NodeNext)
  _types/    TypeScript declaration files (.d.ts)
```

### Build Commands

```bash
# Default build (cleans then runs build:ci)
bun run build

# CI build (all 8 tsgo compilations sequentially, no clean step)
# Runs sequentially because CI runners have limited vCPUs (2 on GitHub Actions)
bun run build:ci

# Size-only build (only permissionless CJS + ESM for size-limit checks)
bun run build:size

# Standard tsc build (all packages, sequential)
bun run build:tsc

# Individual package builds (using tsc)
bun run build:permissionless      # CJS + ESM + types
bun run build:wagmi               # ESM + types (no CJS)
bun run build:mock-paymaster      # CJS + ESM + types

# Individual package builds (using tsgo, parallel within package)
bun run build:permissionless:tsgo
bun run build:wagmi:tsgo
bun run build:mock-paymaster:tsgo

# Clean generated output
bun run clean
```

### Build Scripts Architecture

The `build` script delegates to `build:ci` after cleaning:

```
build = clean + build:ci
```

`build:ci` runs all 8 tsgo compilations **sequentially** in a single command chain:
1. permissionless CJS → permissionless ESM (+ tsc-alias) → permissionless types (+ tsc-alias)
2. wagmi ESM (+ tsc-alias) → wagmi types (+ tsc-alias)
3. mock-paymaster CJS → mock-paymaster ESM (+ tsc-alias) → mock-paymaster types (+ tsc-alias)

Sequential execution is intentional: GitHub Actions runners have only 2 vCPUs, so running 8 parallel CPU-bound tsgo processes causes cache thrashing and is slower than sequential.

The per-package `:tsgo` scripts still use parallel execution (via bash `&` + `wait`) for local development on machines with more cores.

### Per-Format Build Steps

Each format follows the same pattern:

1. **Compile** with tsc (or tsgo) using format-specific tsconfig
2. **Resolve paths** with tsc-alias (ESM and types only — adds `.js` extensions for Node ESM compatibility; CJS doesn't need this since `require()` resolves without extensions)
3. **Inject package.json** into output directory to mark the module type

Example for CJS (no tsc-alias needed):
```bash
tsgo --project ./tsconfig/tsconfig.permissionless.cjs.json \
  && printf '{"type":"commonjs"}' > ./packages/permissionless/_cjs/package.json
```

Example for ESM (tsc-alias adds .js extensions):
```bash
tsgo --project ./tsconfig/tsconfig.permissionless.esm.json \
  && tsc-alias -p ./tsconfig/tsconfig.permissionless.esm.json \
  && printf '{"type":"module","sideEffects":false}' > ./packages/permissionless/_esm/package.json
```

## TypeScript Configuration

### Inheritance Chain

```
tsconfig/tsconfig.base.json                    # Shared compiler options
  tsconfig/tsconfig.permissionless.json        # Package-specific (include/exclude, rootDir)
    tsconfig/tsconfig.permissionless.esm.json  # ESM: module=NodeNext, outDir=_esm
    tsconfig/tsconfig.permissionless.cjs.json  # CJS: module=commonjs, outDir=_cjs
    tsconfig/tsconfig.permissionless.types.json # Types: emitDeclarationOnly, outDir=_types
```

### Key Compiler Options (from `tsconfig.base.json`)

| Option | Value | Rationale |
|--------|-------|-----------|
| `target` | `ES2021` | Node 16+ support |
| `lib` | `["ES2022", "DOM"]` | Error `.cause`, `fetch` types |
| `strict` | `true` | Full strict mode |
| `verbatimModuleSyntax` | `true` | Enforces explicit `import type` |
| `importHelpers` | `true` | Validates no helper injection needed |
| `esModuleInterop` | `false` | No synthetic default imports |
| `noUnusedLocals` | `true` | Catches dead code |
| `noUnusedParameters` | `true` | Catches unused function parameters |
| `skipLibCheck` | `true` | Faster compilation |

### CJS-Specific Overrides

The CJS build adds:
- `module: "commonjs"`, `moduleResolution: "Node"` -- CommonJS output
- `removeComments: true` -- Strips comments to reduce bundle size
- `verbatimModuleSyntax: false` -- Required for CJS compatibility (can't use `import type` syntax in CJS output)

## CI/CD

### PR Workflow

All four jobs run **in parallel** with no dependencies:

```
┌────────┐  ┌────────┐  ┌──────────────┐  ┌──────┐
│  Lint  │  │ Build  │  │ E2E-Coverage │  │ Size │
└────────┘  └────────┘  └──────────────┘  └──────┘
```

- **Lint** — formats and lints code, auto-commits fixes
- **Build** — runs `build:ci` to verify compilation
- **E2E-Coverage** — runs tests with coverage (no build needed — vitest resolves workspace packages from source via aliases)
- **Size** — runs `size-limit-action` to compare bundle sizes against base branch

### Dependency Caching

The `install-dependencies` composite action caches Bun's global install cache (`~/.bun/install/cache`) keyed on `bun.lock`. On cache hit, `bun install` is near-instant.

Foundry is only installed when `install-foundry: 'true'` is passed (E2E job only).

### Main Branch Workflow

Three parallel jobs: **Changesets** (version PRs), **Release** (npm publish), **Canary** (branch-tagged canary releases).

## Package Exports

The `package.json` uses conditional exports to serve the correct format:

```json
{
  "exports": {
    ".": {
      "types": "./_types/index.d.ts",
      "import": "./_esm/index.js",
      "default": "./_cjs/index.js"
    }
  }
}
```

- **`types`** -- TypeScript picks up `.d.ts` files from `_types/`
- **`import`** -- ESM bundlers and Node with `"type": "module"` use `_esm/`
- **`default`** -- CommonJS `require()` falls back to `_cjs/`

See [Export Map](./02-export-map.md) for the complete list of 14 subpath exports.

## Linting & Formatting

The project uses [Biome](https://biomejs.dev/) for both linting and formatting:

```bash
bun run format     # Format all files
bun run lint       # Check for lint issues
bun run lint:fix   # Auto-fix lint issues
```

Configuration (`biome.json`):
- Indent: 4 spaces
- Line width: 80 characters
- Quote style: double quotes
- Semicolons: as-needed
- Trailing commas: none

### Pre-commit Hook

`simple-git-hooks` runs on every commit:
```bash
bun run format && bun run lint:fix
```

## Versioning & Publishing

The project uses [Changesets](https://github.com/changesets/changesets) for version management:

```bash
bun run changeset          # Create a new changeset
bun run changeset:version  # Bump versions based on changesets
bun run changeset:release  # Build + publish to npm
```

Configuration (`.changeset/config.json`):
- Access: `public`
- Base branch: `main`
- Changelog: `@changesets/changelog-git`

## Bundle Size Tracking

[size-limit](https://github.com/ai/size-limit) enforces maximum bundle sizes:

| Entry | Format | Limit |
|-------|--------|-------|
| `permissionless` | ESM | 250 kB |
| `permissionless` | CJS | 500 kB |

The `build:size` script builds only the permissionless CJS + ESM targets needed for size checking (skips wagmi, mock-paymaster, and types).

Checked via `bun run size-limit` locally, or via `size-limit-action` in CI.

## Testing

Tests use [Vitest](https://vitest.dev/) with the v8 coverage provider:

```bash
bun run test                # Watch mode (development)
bun run test:ci             # CI mode with coverage
bun run test:ci-no-coverage # CI mode without coverage
```

Configuration is in `packages/permissionless/vitest.config.ts`. The vitest config includes a resolve alias for `@pimlico/mock-paymaster` that points to the source TypeScript file, allowing tests to run without building the package first.

Tests are colocated with source files as `*.test.ts`. See [Testing Infrastructure](../testing/01-architecture.md) for the full test setup documentation.

## Adding a New Export Subpath

To add a new subpath export (e.g., `permissionless/foo`):

1. Create the source file(s) under `packages/permissionless/foo/`
2. Create a barrel file at `packages/permissionless/foo/index.ts`
3. Add the export to `packages/permissionless/package.json`:
   ```json
   "./foo": {
     "types": "./_types/foo/index.d.ts",
     "import": "./_esm/foo/index.js",
     "default": "./_cjs/foo/index.js"
   }
   ```
4. Rebuild: `bun run build:permissionless`
5. Verify the export resolves correctly in both ESM and CJS consumers
