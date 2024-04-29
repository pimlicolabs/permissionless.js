# Docker E2E Tests

Permissionless E2E tests.

#### Running tests locally

setup a mock environment with:
```console
docker compose up -d
```

run test with:
```console
bun run test
```

#### Running github workflow locally
```console
act -W .github/workflows/on-pull-request.yml
```

#### Directory Breakdown
```
mock-aa-infra/        => mock paymaster and alto instance
src/                  => test cases found here
```

#### Adding new tests
Add a new entry to either `src/ep-0.6/coreSmartClientActions.test.ts` and or `src/ep-0.7/coreSmartClientActions.test.ts` to ensure that the new smart account handles all core functions.
