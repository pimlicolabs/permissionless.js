# Permissionless.js Codebase Analysis

## Overview

Permissionless.js is a TypeScript utility library for working with ERC-4337
(Account Abstraction). It provides a comprehensive set of tools for creating and
managing smart accounts, executing user operations, and integrating with various
bundlers and paymasters.

## Project Structure

### Directory Organization

```
packages/permissionless/
├── accounts/           # Smart account implementations
│   ├── biconomy/      # Biconomy smart account
│   ├── etherspot/     # Etherspot smart account
│   ├── kernel/        # Kernel smart account (v2, v3, EIP-7702)
│   ├── light/         # Light account
│   ├── nexus/         # Nexus smart account
│   ├── safe/          # Safe (Gnosis) smart account
│   ├── simple/        # Simple account (reference implementation)
│   ├── thirdweb/      # Thirdweb smart account
│   └── trust/         # Trust wallet smart account
├── actions/           # Blockchain interaction functions
│   ├── erc7579/       # ERC-7579 modular account actions
│   ├── etherspot/     # Etherspot-specific actions
│   ├── passkeyServer/ # Passkey authentication actions
│   ├── pimlico/       # Pimlico bundler/paymaster actions
│   ├── public/        # Public RPC actions
│   └── smartAccount/  # Generic smart account actions
├── clients/           # Client implementations
├── errors/            # Custom error definitions
└── utils/             # Utility functions
```

## Technology Stack

### Core Dependencies

- **viem** (^2.28.1): Core Ethereum library for type-safe interactions
- **ox** (0.6.7, optional): Additional utilities

### Build Tools

- **TypeScript**: Strict mode with comprehensive type checking
- **Bun**: Package manager and build tool
- **tsc**: TypeScript compiler for CJS/ESM/types builds
- **tsc-alias**: Path alias resolution

### Testing

- **Vitest**: Test runner with concurrent test execution
- **V8**: Code coverage provider
- **permissionless-test**: Internal testing utilities package

## Coding Patterns and Conventions

### 1. Smart Account Factory Pattern

Each smart account implementation follows a consistent factory pattern:

```typescript
export async function to[AccountName]SmartAccount<
    entryPointVersion extends EntryPointVersion,
    owner extends OneOf<...>,
    eip7702 extends boolean = false
>(parameters: To[AccountName]SmartAccountParameters<entryPointVersion, owner, eip7702>): Promise<SmartAccount<entryPointVersion, ...>>
```

Key characteristics:

- Generic type parameters for flexibility
- Conditional parameter types based on features
- Returns a `SmartAccount` interface implementation
- Implements required methods: `getAddress`, `encodeCalls`, `decodeCalls`,
  `getNonce`, `getStubSignature`, `sign`, `signMessage`, `signTypedData`,
  `signUserOperation`

### 2. Action Pattern

Actions are async functions that interact with the blockchain:

```typescript
export async function actionName<TParameters>(
    client: Client,
    parameters: TParameters,
): Promise<TReturnType> {
    // Implementation using getAction() for composability
}
```

### 3. Type System Conventions

- Extensive use of generics for flexibility
- Conditional types based on entry point versions
- `OneOf` utility for union types
- Naming convention: `[Feature]Parameters` for inputs, `[Feature]ReturnType` for
  outputs
- Separate type definition files for complex types

### 4. Import/Export Structure

- Index files for clean module exports
- Re-export pattern for public API
- Type imports using `type` keyword
- Consistent `.js` extensions in imports (ESM compatibility)

### 5. Error Handling

- Custom error classes extending viem's `BaseError`
- Descriptive error messages with documentation links
- Minimal error handling code
- Error naming: `[Context]Error`

### 6. Code Style

- **No comments** unless absolutely necessary
- Descriptive function and variable names
- Early returns for error conditions
- Destructuring for parameter handling
- Async/await over promises
- Const for immutable values

## Build System

### Build Outputs

The project builds to three formats:

1. **CommonJS** (`_cjs/`): For Node.js compatibility
2. **ESM** (`_esm/`): For modern JavaScript environments
3. **Types** (`_types/`): TypeScript declaration files

### TypeScript Configuration

- **Target**: ES2021 (Node 16+ compatibility)
- **Lib**: ES2022 + DOM (for Error.cause and fetch types)
- **Strict Mode**: Full strict checking enabled
- Additional checks: `noFallthroughCasesInSwitch`, `noImplicitReturns`,
  `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`

## Testing Approach

### Test Structure

- `describe.each()` for testing multiple account types
- `testWithRpc` wrapper for RPC-dependent tests
- Conditional test execution based on feature support
- Clear structure: setup → action → assertions

### Test Configuration

- Vitest with Node environment
- 60-second test timeout
- Sequential test execution (no concurrency)
- V8 coverage reporting
- Test files: `**/*.test.ts`

## Architectural Patterns

### 1. Factory Pattern

Used for creating smart account instances with consistent interfaces.

### 2. Adapter Pattern

Different account implementations adapt to a common `SmartAccount` interface.

### 3. Strategy Pattern

Different signing methods and validation strategies per account type.

### 4. Builder Pattern

Complex objects (like user operations) built step by step.

### 5. Modular Architecture

Clear separation between:

- Account implementations
- Actions (operations)
- Utilities
- Error handling
- Type definitions

## Key Design Principles

1. **Type Safety**: Extensive TypeScript usage with strict checking
2. **Modularity**: Clear separation of concerns
3. **Extensibility**: Easy to add new account types or actions
4. **Consistency**: Uniform patterns across implementations
5. **Minimal Dependencies**: Only essential dependencies
6. **No Side Effects**: Pure functions where possible
7. **Error Clarity**: Descriptive errors with actionable messages

## Development Workflow

### Adding a New Smart Account

1. Create directory under `accounts/[name]/`
2. Implement `to[Name]SmartAccount` function
3. Add ABI files if needed
4. Implement utility functions in `utils/`
5. Export from `accounts/index.ts`
6. Add comprehensive tests

### Adding a New Action

1. Create file in appropriate `actions/` subdirectory
2. Define parameter and return types
3. Implement async function
4. Export from category index file
5. Add tests with RPC mocking

### Testing Guidelines

- Test all entry point versions
- Test both deployed and undeployed accounts
- Mock RPC calls appropriately
- Use `testWithRpc` for integration tests
- Ensure comprehensive error case coverage
