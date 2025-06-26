# Mock Paymaster Codebase Analysis

## Overview

Mock Paymaster is a testing utility that creates a local paymaster instance for ERC-4337 development. It provides a mock paymaster server that can be used with Prool for local testing of account abstraction features without needing external paymaster services.

## Project Structure

### Directory Organization

```
packages/mock-paymaster/
├── helpers/           # Utility functions
│   ├── abi.ts        # Contract ABIs
│   ├── erc20-utils.ts # ERC20 token deployment utilities
│   ├── schema.ts     # Zod schemas for validation
│   └── utils.ts      # General utilities
├── constants.ts      # Contract addresses and constants
├── index.ts          # Main entry point with Prool instance
├── relay.ts          # RPC handler implementation
└── singletonPaymasters.ts # Paymaster deployment logic
```

## Technology Stack

### Core Dependencies

- **prool** (^0.0.23): Local blockchain testing framework
- **viem** (^2.28.1): Ethereum library for type-safe interactions
- **fastify** (^4.28.1): Web framework for RPC server
- **@fastify/cors** (^8.5.0): CORS support for cross-origin requests
- **zod** (^3.24.2): Schema validation

### Build Tools

- **TypeScript**: Strict mode with comprehensive type checking
- **Bun**: Package manager and build tool
- **tsc**: TypeScript compiler for CJS/ESM/types builds

## Coding Patterns and Conventions

### 1. Prool Instance Pattern

The package exports a Prool instance definition:

```typescript
export const paymaster = defineInstance(
    ({ anvilRpc, port, altoRpc }: { anvilRpc: string; port: number; altoRpc: string }) => {
        // Instance configuration
    }
)
```

### 2. RPC Handler Pattern

Implements JSON-RPC methods for paymaster operations:

```typescript
const rpcHandler = createRpcHandler({
    bundler,
    publicClient,
    paymasterSigner: walletClient
})
```

### 3. Schema Validation

Uses Zod for request/response validation:

```typescript
const schema = z.object({
    // Schema definition
})
```

### 4. Deployment Utilities

Provides functions to deploy test contracts:

- `deployPaymasters()`: Deploys paymaster contracts
- `deployErc20Token()`: Deploys test ERC20 tokens

### 5. Code Style

- **No comments** unless absolutely necessary
- Descriptive function and variable names
- Early returns for error conditions
- Async/await over promises
- Const for immutable values

## Architecture

### Server Architecture

1. **Fastify Server**: Handles HTTP requests
2. **RPC Handler**: Processes JSON-RPC calls
3. **Contract Deployment**: Sets up test environment
4. **CORS Support**: Enables cross-origin requests

### Integration Points

- **Anvil**: Local Ethereum node
- **Alto**: Bundler for user operations
- **Viem**: Blockchain interactions

## Key Design Principles

1. **Simplicity**: Minimal setup for testing
2. **Type Safety**: Full TypeScript support
3. **Local Testing**: No external dependencies
4. **Compatibility**: Works with standard ERC-4337 tools

## Development Workflow

### Starting the Mock Paymaster

1. Configure Anvil RPC endpoint
2. Configure Alto bundler endpoint
3. Start the instance with port configuration
4. Server deploys necessary contracts
5. Ready to handle paymaster requests

### Adding New Features

1. Update RPC handler for new methods
2. Add schema validation if needed
3. Implement business logic
4. Update types and exports

### Testing Guidelines

- Test with local Anvil instance
- Verify contract deployments
- Test RPC method responses
- Ensure proper error handling