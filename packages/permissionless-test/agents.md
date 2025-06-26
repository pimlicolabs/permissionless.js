# Permissionless Test Utilities Codebase Analysis

## Overview

Permissionless-test is an internal testing utilities package that provides comprehensive test infrastructure for the Permissionless.js ecosystem. It includes mock account abstraction infrastructure, test helpers, and utilities for setting up local testing environments with all necessary ERC-4337 components.

## Project Structure

### Directory Organization

```
packages/permissionless-test/
├── mock-aa-infra/          # Mock infrastructure setup
│   └── alto/               # Alto bundler configuration
│       ├── constants/      # Account-specific constants
│       │   ├── accounts/   # Constants for each account type
│       │   └── core.ts     # Core infrastructure constants
│       ├── index.ts        # Infrastructure setup
│       └── instance.ts     # Alto instance configuration
└── src/                    # Test utilities
    ├── testWithRpc.ts      # RPC test fixture
    ├── types.ts            # Type definitions
    └── utils.ts            # Test helper functions
```

## Technology Stack

### Core Dependencies

- **prool**: Local blockchain testing framework
- **viem**: Ethereum library for blockchain interactions
- **vitest**: Test runner and fixtures
- **@pimlico/alto**: ERC-4337 bundler
- **@pimlico/mock-paymaster**: Mock paymaster for testing
- **get-port**: Dynamic port allocation

### Infrastructure Components

- **Anvil**: Local Ethereum node (via Prool)
- **Alto**: ERC-4337 bundler instance
- **Mock Paymaster**: Local paymaster server

## Test Infrastructure

### 1. RPC Test Fixture

The `testWithRpc` fixture provides a complete ERC-4337 testing environment:

```typescript
export const testWithRpc = test.extend<{
    rpc: {
        anvilRpc: string
        altoRpc: string
        paymasterRpc: string
    }
}>
```

Features:
- Automatic port allocation
- Instance lifecycle management
- Parallel test support
- Fork mode support

### 2. Smart Account Factories

Provides factory functions for all supported smart accounts:
- Simple Account (v0.6, v0.7, v0.8)
- Kernel Account (multiple versions)
- Safe Account (standard and ERC-7579)
- Light Account (v1.1.0, v2.0.0)
- Biconomy Account
- Trust Account
- Nexus Account
- Etherspot Account
- Thirdweb Account

### 3. Client Utilities

Helper functions for creating various clients:
- `getBundlerClient()`: Smart account client with bundler
- `getSmartAccountClient()`: Standard smart account client
- `getPimlicoClient()`: Pimlico-specific client
- `getPublicClient()`: Viem public client
- `getAnvilWalletClient()`: Test wallet client

## Coding Patterns and Conventions

### 1. Factory Function Pattern

Each account type has a dedicated factory:

```typescript
export const get[AccountType]Client = async <
    entryPointVersion extends EntryPointVersion
>(params: AAParamType<entryPointVersion>) => {
    // Account creation logic
}
```

### 2. Configuration Pattern

Centralized configuration for test accounts:

```typescript
export const getCoreSmartAccounts = (): Array<{
    name: string
    supportsEntryPointV06: boolean
    supportsEntryPointV07: boolean
    supportsEntryPointV08: boolean
    isEip7702Compliant?: boolean
    isEip1271Compliant: boolean
    getSmartAccountClient: Function
    getErc7579SmartAccountClient?: Function
}>
```

### 3. Instance Management

Lifecycle management for test infrastructure:

```typescript
const instances = await getInstances({
    anvilPort,
    altoPort,
    paymasterPort
})
// Use instances
await Promise.all(instances.map(instance => instance.stop()))
```

### 4. Code Style

- **No comments** unless absolutely necessary
- Descriptive function names
- Consistent async/await usage
- Type-safe implementations
- Early returns for error conditions

## Architecture

### Test Environment Architecture

1. **Anvil Node**: Local blockchain with Prague hardfork
2. **Alto Bundler**: Handles user operations
3. **Mock Paymaster**: Sponsors transactions
4. **Contract Deployment**: Sets up necessary contracts

### Integration Flow

1. Start Anvil instance
2. Deploy ERC-4337 contracts (if not forked)
3. Start Alto bundler
4. Start mock paymaster
5. Run tests
6. Clean up instances

## Key Design Principles

1. **Isolation**: Each test gets fresh instances
2. **Parallelization**: Dynamic port allocation
3. **Flexibility**: Support for multiple account types
4. **Reusability**: Shared utilities across tests
5. **Type Safety**: Full TypeScript support

## Development Workflow

### Writing Tests

1. Use `testWithRpc` fixture for ERC-4337 tests
2. Select appropriate account factory
3. Create clients with test utilities
4. Execute test scenarios
5. Automatic cleanup handled by fixture

### Adding New Account Types

1. Add constants in `mock-aa-infra/alto/constants/accounts/`
2. Create factory function in `utils.ts`
3. Add to `getCoreSmartAccounts()` array
4. Update type definitions if needed

### Testing Best Practices

- Use dedicated test accounts
- Test multiple entry point versions
- Verify both deployed and undeployed states
- Test with and without paymasters
- Check ERC-7579 compliance where applicable

## Utility Functions

### Infrastructure Helpers

- `ensureBundlerIsReady()`: Wait for bundler availability
- `ensurePaymasterIsReady()`: Wait for paymaster availability
- `setupContracts()`: Deploy required contracts

### Account Helpers

- Private key generation
- Mnemonic-based accounts
- Multiple owner configurations
- Version-specific account creation

## Configuration

### Default Values

- **Test Mnemonic**: Standard test mnemonic
- **Chain**: Foundry (local)
- **Hardfork**: Prague
- **Paymaster RPC**: `http://localhost:3000`

### Environment Variables

- `VITE_FORK_RPC_URL`: Fork from existing chain (optional)