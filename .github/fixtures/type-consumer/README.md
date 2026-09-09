# type-consumer fixture

Type-checks the packed `permissionless` tarball the way consumers do (issue #522). CI's `package-types` job builds the package, `npm pack`s it into this directory, installs the tarball with `--no-save`, and runs one `tsc` per leg:

| leg | module / moduleResolution | proves |
| --- | --- | --- |
| `tsconfig.bundler.json` | `esnext` / `bundler` | the exports map routes to `_types`; strictest consumer flags, `skipLibCheck: false` |
| `tsconfig.node16.json` | `node16` / `node16` | an ESM consumer on Node's resolution (the fixture is `"type": "module"`) |
| `tsconfig.nodenext.json` | `nodenext` / `nodenext` | the same on current Node semantics |
| `tsconfig.node10.json` | `commonjs` / `node10` | `typesVersions` routes legacy resolution to `_types` (raw `.ts` leaking in fails even with `skipLibCheck`) |

The node10 leg exists only to prove `typesVersions`. TypeScript 7 dropped `node10`, so every leg runs on the fixture's pinned TypeScript 5.9.3; bump it only while `typesVersions` ships. `issue-500.ts` (the #500 variance fast path) is excluded from the node10 leg, see that tsconfig.

Locally:

```bash
bun run build:permissionless
(cd packages/permissionless && npm pack --pack-destination ../../.github/fixtures/type-consumer)
cd .github/fixtures/type-consumer
npm install --no-package-lock && npm install --no-package-lock --no-save ./permissionless-*.tgz
for leg in bundler node16 nodenext node10; do npx tsc -p tsconfig.$leg.json; done
```
