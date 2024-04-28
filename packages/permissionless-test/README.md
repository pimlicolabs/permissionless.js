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
