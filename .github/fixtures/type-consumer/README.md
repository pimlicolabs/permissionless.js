# type-consumer fixture

Type-checks the packed `permissionless` tarball the way consumers do (issue #522) and runs the package's own type tests against it. CI's `package-types` job (`on-pull-request.yml`) builds the package, `npm pack`s it into this directory, copies every `packages/permissionless/**/*.test-d.ts` into `./test-d`, installs the tarball plus one TypeScript from the matrix `{5.9.3, 6.0.3, 7.0.2}` with `--no-save`, and runs one `tsc` per leg:

| leg | module / moduleResolution | TypeScript | proves |
| --- | --- | --- | --- |
| `tsconfig.bundler.json` | `esnext` / `bundler` | all | the exports map routes to `_types`; strictest consumer flags, `skipLibCheck: false` |
| `tsconfig.node16.json` | `node16` / `node16` | all | an ESM consumer on Node's resolution (the fixture is `"type": "module"`) |
| `tsconfig.nodenext.json` | `nodenext` / `nodenext` | all | the same on current Node semantics |
| `tsconfig.node10.json` | `commonjs` / `node10` | 5.9.3, 6.0.3 (`--ignoreDeprecations 6.0`) | `typesVersions` routes legacy resolution to `_types` (raw `.ts` leaking in fails even with `skipLibCheck`); TypeScript 7 removed `node10` |
| `tsconfig.test-d.json` | `esnext` / `bundler` | all | the `*.test-d.ts` suite passes against the emitted `.d.ts`, not just the sources — a rename or a widened type in the build output fails here |
| `tsconfig.declaration.json` | `nodenext` / `nodenext`, `declaration` + `emitDeclarationOnly` | all | `declaration.ts` exports inferred permissionless values (clients, accounts, action results); TS2742 (5.x/6.x) or TS2883 (7) "inferred type cannot be named" means a type is only reachable through a path the package does not export (viem's `environments/tsc/declaration` probe) |
| `tsconfig.declaration.extend.json` | same | all | `declaration.extend.ts` exports `.extend()`ed clients and bare action methods: `extend` copies the action bag structurally, so the emitter must spell out `SendTransactionParameters`, `Erc7579.InstallModuleParameters`, `Pimlico.SponsorUserOperationParameters`, `types/utils` helpers … from files no entrypoint reaches. The `./_types/*` export row (viem ships the same one) lets tsc synthesise `import("permissionless/_types/<path>")` for them; without it this leg is red on 5.9.3 / 6.0.3 / 7.0.2 |

`issue-500.ts` (the #500 variance fast path) is excluded from the node10 leg, see that tsconfig. `publint` and `attw` run once, on the 7.0.2 leg.

The type tests import `permissionless` / `permissionless/pimlico` / `permissionless/etherspot`, so the same files type-check against the sources (vitest typecheck, `bun run test:types`, `tsconfig/tsconfig.permissionless.test-d.json` maps the entrypoints with `paths`) and against the tarball here.

Locally:

```bash
bun run build:permissionless
(cd packages/permissionless && npm pack --pack-destination ../../.github/fixtures/type-consumer)
rsync -a --prune-empty-dirs --exclude node_modules --exclude _esm --exclude _types \
  --include '*/' --include '*.test-d.ts' --exclude '*' \
  packages/permissionless/ .github/fixtures/type-consumer/test-d/
cd .github/fixtures/type-consumer
npm install --no-package-lock
npm install --no-package-lock --no-save typescript@7.0.2 ./permissionless-*.tgz   # or 5.9.3 / 6.0.3
for leg in bundler node16 nodenext test-d declaration declaration.extend; do npx tsc -p tsconfig.$leg.json; done
grep -o 'permissionless/_types/[^"]*' declaration-out/declaration.extend.d.ts | sort -u   # the escape hatch in use
npx tsc -p tsconfig.node10.json                       # 5.9.3
npx tsc -p tsconfig.node10.json --ignoreDeprecations 6.0   # 6.0.3
```
