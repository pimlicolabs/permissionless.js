# Build System

The permissionless monorepo uses TypeScript compilation (no bundler) to produce three output formats per package: CommonJS, ES Modules, and TypeScript declaration files.

## Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | ^5.2.2 | Type checking and compilation |
| tsgo | @typescript/native-preview ^7.0.0 | Fast native TypeScript compiler (used for default builds) |
| tsc-alias | ^1.8.8 | Resolves path aliases in compiled output |
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
# Default build (uses tsgo for speed, all packages in parallel)
bun run build

# Standard tsc build (all packages)
bun run build:tsc

# Individual package builds
bun run build:permissionless      # CJS + ESM + types
bun run build:wagmi               # ESM + types (no CJS)
bun run build:mock-paymaster      # CJS + ESM + types

# Clean generated output
bun run clean
```

### Per-Format Build Steps

Each format follows the same pattern:

1. **Compile** with tsc (or tsgo) using format-specific tsconfig
2. **Resolve aliases** with tsc-alias
3. **Inject package.json** into output directory to mark the module type

Example for CJS:
```bash
tsc --project ./tsconfig/tsconfig.permissionless.cjs.json \
  && tsc-alias -p ./tsconfig/tsconfig.permissionless.cjs.json \
  && printf '{"type":"commonjs"}' > ./packages/permissionless/_cjs/package.json
```

Example for ESM:
```bash
tsc --project ./tsconfig/tsconfig.permissionless.esm.json \
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
| `permissionless` | ESM | 60 kB |
| `permissionless` | CJS | 500 kB |

Checked via `bun run size-limit` (typically run in CI).

## Testing

Tests use [Vitest](https://vitest.dev/) with the v8 coverage provider:

```bash
bun run test                # Watch mode (development)
bun run test:ci             # CI mode with coverage
bun run test:ci-no-coverage # CI mode without coverage
```

Configuration is in `packages/permissionless/vitest.config.ts`. Tests are colocated with source files as `*.test.ts`. See [Testing Infrastructure](../testing/01-architecture.md) for the full test setup documentation.

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
