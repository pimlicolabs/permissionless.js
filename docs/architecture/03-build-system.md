# Build System

The permissionless monorepo uses TypeScript compilation (no bundler) to produce two outputs per package: ES modules and TypeScript declaration files. Packages are ESM-only.

## Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | 7.0.2 (exact) | Native compiler; `tsc` builds every output |
| typescript5 | npm:typescript@5.9.3 | JS-based TypeScript 5.9 kept for local consumer checks; CI installs its own 5.9.3 / 6.0.3 for the matrix legs and vitest's typecheck drives the TS 7 binary |
| Biome | 2.5.12 | Linter and formatter (replaces ESLint/Prettier) |
| Vitest | ^2.1.5 | Test runner with coverage-v8 |
| Changesets | ^2.26.2 | Version management and changelog generation |
| size-limit | ^9.0.0 | Bundle size tracking |
| simple-git-hooks | ^2.9.0 | Pre-commit hook runner |
| bun | (runtime) | Package manager and script runner |

## Build Pipeline

Each package produces two output directories:

```
packages/permissionless/
  _esm/      ES Module output (module: NodeNext, moduleResolution: NodeNext)
  _types/    TypeScript declaration files (.d.ts)
```

### Build Commands

```bash
# Default build: the three package builds in parallel (each cleans its own output first)
bun run build

# CI build: same three builds, sequential (2-vCPU runners)
bun run build:ci

# Per-package builds (ESM + types in one tsc run)
bun run build:permissionless
bun run build:wagmi
bun run build:mock-paymaster

# Size job entry point (permissionless only)
bun run build:size

# Clean generated output
bun run clean
```

### Build Scripts Architecture

Each per-package script is `clean:<pkg>` followed by one `tsc --project` run that emits `_esm/` and `_types/` together (a separate declaration-only run would type-check the same program twice for identical output). `build` runs the three package scripts in parallel and propagates the first failure (`wait $pid` per job; a bare `wait` would swallow it). `build:ci` runs them sequentially because GitHub Actions runners have 2 vCPUs.

`tsc` does everything: sources already carry `.js` specifiers, so nothing rewrites paths after emit, and the package-level `"type": "module"` makes `_esm/` ESM without a nested `package.json`.

## TypeScript Configuration

### Inheritance Chain

```
tsconfig/tsconfig.base.json                    # Shared compiler options
  tsconfig/tsconfig.permissionless.json        # Package-specific (include/exclude, rootDir)
    tsconfig/tsconfig.permissionless.esm.json  # module=NodeNext, outDir=_esm, declarationDir=_types
```

### Key Compiler Options (from `tsconfig.base.json`)

| Option | Value | Rationale |
|--------|-------|-----------|
| `target` | `ES2021` | Node 16+ support |
| `lib` | `["ES2022", "DOM"]` | Error `.cause`, `fetch` types |
| `types` | `[]` | No ambient globals (TS 7 default, made explicit) |
| `strict` | `true` | Full strict mode |
| `verbatimModuleSyntax` | `true` | Enforces explicit `import type` |
| `noUnusedLocals` | `true` | Catches dead code |
| `noUnusedParameters` | `true` | Catches unused function parameters |
| `skipLibCheck` | `true` | Faster compilation |

## CI/CD

### PR Workflow

All five jobs run **in parallel** with no dependencies:

```
┌────────┐  ┌────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────┐
│  Lint  │  │ Build  │  │ Package types │  │ E2E-Coverage │  │ Size │
└────────┘  └────────┘  └───────────────┘  └──────────────┘  └──────┘
```

- **Lint** — formats and lints code, auto-commits fixes
- **Build** — runs `bun run build` to verify compilation
- **Package types** — a TypeScript `{5.9.3, 6.0.3, 7.0.2}` matrix: packs `permissionless`, installs the tarball into `.github/fixtures/type-consumer` and type-checks it as bundler, node16, nodenext and (≤ 6) node10 consumers, runs the `*.test-d.ts` suite against the emitted `.d.ts`, and emits declarations for a module of inferred permissionless values (the TS2742/TS2883 probe; the extended-client half is a known failure kept `continue-on-error` until the `./_types/*` decision); `publint --strict` and `attw --pack --profile esm-only` gate the manifest on the 7.0.2 leg (see the fixture README)
- **E2E-Coverage** — runs tests with coverage (no build needed — vitest resolves workspace packages from source via aliases)
- **Size** — runs `size-limit-action` to compare bundle sizes against base branch

### Dependency Caching

The `install-dependencies` composite action caches Bun's global install cache (`~/.bun/install/cache`) keyed on `bun.lock`. On cache hit, `bun install` is near-instant.

Foundry is only installed when `install-foundry: 'true'` is passed (E2E job only).

### Main Branch Workflow

Three parallel jobs: **Changesets** (version PRs), **Release** (npm publish), **Canary** (branch-tagged canary releases).
The Canary job is guarded with `if: github.ref == 'refs/heads/main'`, so a `workflow_dispatch` from another branch never publishes a branch-named dist-tag.

### viem Canary Workflow

`viem-canary.yml` runs nightly (and on `workflow_dispatch`) with a `latest` / `next` matrix: it resolves the tag, skips the leg when the version is outside the package's viem peer range, otherwise `bun add -d viem@<version>` at the root, `bun run build`, `test:ci-no-coverage` (foundry + `VITE_FORK_RPC_URL`), and `test:types` once that script exists. Failing steps continue, then the last step files or updates one issue titled `viem canary: <tag> failing` (label `viem-canary`) and closes it when the leg is green again. Schedules only fire from the default branch.

## Package Exports

The `package.json` uses conditional exports; every entry is `{ types, default }`:

```json
{
  "exports": {
    ".": {
      "types": "./_types/index.d.ts",
      "default": "./_esm/index.js"
    }
  }
}
```

- **`types`** -- TypeScript picks up `.d.ts` files from `_types/`
- **`default`** -- everything else (`import`, bundlers, Node `require(esm)`) uses `_esm/`

`typesVersions["*"]` mirrors each subpath to its `.d.ts` for `moduleResolution: node10` consumers, and each subpath directory ships a proxy `package.json` pointing at `_types`/`_esm` for resolvers that ignore `exports`.

See [Export Map](./02-export-map.md) for the complete list of subpath exports.

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

The `build:size` script builds only the permissionless package (skips wagmi and mock-paymaster).

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
3. Add the export to `packages/permissionless/package.json`, plus a `typesVersions["*"]` entry (`"foo": ["./_types/foo/index.d.ts"]`) and a proxy `packages/permissionless/foo/package.json`:
   ```json
   "./foo": {
     "types": "./_types/foo/index.d.ts",
     "default": "./_esm/foo/index.js"
   }
   ```
4. Add the subpath to `.github/fixtures/type-consumer/consumer.ts`
5. Rebuild: `bun run build:permissionless`, then `npx publint --strict` in the package
