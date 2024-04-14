# Docker E2E Tests

Permissionless E2E tests using `docker compose`.

#### Running tests locally
```console
docker compose up --abort-on-container-exit test-cases
```

#### Running github workflow locally
```console
act -W .github/workflows/on-pull-request.yml -j docker-e2e
```

#### Directory Breakdown
```
contract-deployer/    => deploys all AA related contracts
mock-paymaster/       => mocks a verifying paymaster
test-cases/           => jest test suite 
```
