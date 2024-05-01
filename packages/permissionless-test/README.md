# Permissionless.js E2E Tests

Docker E2E tests.

### Running tests locally

setup a mock AA environment with:
```console
docker compose up -d
```

run the test cases with:
```console
bun run test
```

alternatively, run the github workflow action locally:
```console
act -W .github/workflows/on-pull-request.yml
```

### Directory Breakdown
```
mock-aa-infra/        => mock paymaster and alto bundler instance
src/                  => test cases found here
```

### Mock AA Environment
The test cases are ran against a mock environment that is spun up using `docker-compose`.

Environment setup procedure:
1) Start up a local anvil instance
2) Deploy and setup all AA related contracts (EntryPoints, Smart Account Factories, Verifying Paymasters, ...)
3) Start a local [alto](https://github.com/pimlicolabs/alto) bundler instance
4) Start a mock verifying paymaster
5) Run test cases

When docker-compose is running, the AA related services will be accessible through following ports:
- `anvil` at `localhost:8545`
- `alto` at `localhost:4337`
- `mock paymaster` at `localhost:3000`

### Adding new tests
1. Add a smart account client builder helper in `src/utils.ts` for the new smart account.
2. Add a new entry to either `src/ep-0.6/coreSmartClientActions.test.ts` and or `src/ep-0.7/coreSmartClientActions.test.ts` to ensure that the new smart account handles all core functions.
