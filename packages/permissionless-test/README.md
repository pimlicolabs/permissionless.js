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
mock-aa-infra/        => Mock paymaster and alto bundler instance
src/                  => Test cases found here
```

### Mock AA Environment
The test cases are ran against a mock environment that is spun up using `docker-compose`.

#### When docker-compose is running, the related services can be accessed through the following ports:
- __Anvil__ at `localhost:8545`
- __Alto__ at `localhost:4337`
- __MockPaymaster__ at `localhost:3000`

#### Docker-compose configures the environment by:

1) Starting a local Anvil instance.
2) Deploying and setting up related contracts (EntryPoints, Smart Account Factories, Verifying Paymasters, etc.).
3) Launching a local Alto Bundler instance.
4) Initiating a mock Verifying Paymaster instance.
5) Running test cases.

### Adding new tests
1. Add a smart account client builder helper in `src/utils.ts` for the new smart account.
2. Add a new entry to either `src/ep-0.6/coreSmartClientActions.test.ts` and or `src/ep-0.7/coreSmartClientActions.test.ts` to ensure that the new smart account handles all core functions.
