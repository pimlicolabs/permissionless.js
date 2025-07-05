# Wagmi Permissionless Integration Codebase Analysis

## Overview

@permissionless/wagmi is a React hooks library that integrates Permissionless.js with Wagmi v2. It provides React hooks and context providers to seamlessly use ERC-4337 account abstraction features within Wagmi-based applications.

## Project Structure

### Directory Organization

```
packages/wagmi/
├── hooks/                    # React hooks
│   ├── useAvailableCapabilities.ts  # Hook for checking wallet capabilities
│   ├── useSendTransaction.ts        # Enhanced transaction sending hook
│   └── useWaitForTransactionReceipt.ts # Transaction receipt waiting hook
├── utils/                    # Utility functions
│   └── observe.ts           # Observable pattern utilities
├── context.tsx              # React context provider
└── index.ts                 # Main exports
```

## Technology Stack

### Core Dependencies

- **wagmi** (^2.15.1): React hooks for Ethereum (peer dependency)
- **react**: React library (inherited from wagmi)
- **viem**: Ethereum library (inherited from wagmi)

### Build Tools

- **TypeScript**: Strict mode with comprehensive type checking
- **Bun**: Package manager and build tool
- **tsc**: TypeScript compiler for CJS/ESM/types builds

## Coding Patterns and Conventions

### 1. Hook Enhancement Pattern

Extends existing Wagmi hooks with ERC-4337 capabilities:

```typescript
export function useSendTransaction(
    parameters: UseSendTransactionParameters = {}
): UseSendTransactionReturnType {
    // Enhanced implementation
}
```

### 2. Context Provider Pattern

Provides configuration through React context:

```typescript
export function PermissionlessProvider({
    children,
    ...props
}: PermissionlessProviderProps) {
    // Context provider implementation
}
```

### 3. Observable Pattern

Uses observables for reactive state management:

```typescript
function observe<T>(
    getValue: () => T,
    callback: (value: T) => void
): () => void {
    // Observable implementation
}
```

### 4. Type Augmentation

Extends Wagmi types with additional parameters:

```typescript
type UseSendTransactionParameters = WagmiUseSendTransactionParameters & {
    // Additional ERC-4337 parameters
}
```

### 5. Code Style

- **No comments** unless absolutely necessary
- Descriptive function and variable names
- Consistent with Wagmi's API design
- Type-safe with full TypeScript support

## Architecture

### Hook Architecture

1. **Enhanced Hooks**: Wrap Wagmi hooks with additional functionality
2. **Context Integration**: Access shared configuration
3. **Observable State**: Reactive updates for async operations
4. **Type Safety**: Full TypeScript support

### Integration Points

- **Wagmi Config**: Integrates with Wagmi's configuration
- **Smart Accounts**: Supports ERC-4337 smart accounts
- **Bundlers**: Works with various bundler implementations
- **Paymasters**: Supports paymaster functionality

## Key Design Principles

1. **Seamless Integration**: Works naturally with existing Wagmi code
2. **Backward Compatibility**: Doesn't break existing Wagmi functionality
3. **Type Safety**: Maintains Wagmi's type-safe approach
4. **React Best Practices**: Follows React hooks conventions
5. **Minimal API Surface**: Only exposes necessary functionality

## Hook Documentation

### useSendTransaction

Enhanced transaction sending with ERC-4337 support:
- Supports smart account transactions
- Handles user operation creation
- Integrates with bundlers and paymasters

### useWaitForTransactionReceipt

Waits for transaction receipts with ERC-4337 awareness:
- Handles both regular and user operation receipts
- Provides proper typing for different receipt types

### useAvailableCapabilities

Checks wallet capabilities for ERC-4337 features:
- Detects smart account support
- Identifies available paymaster services
- Checks bundler compatibility

## Development Workflow

### Using the Hooks

1. Wrap app with `PermissionlessProvider`
2. Use hooks like regular Wagmi hooks
3. Access additional ERC-4337 features
4. Handle both EOA and smart account flows

### Adding New Hooks

1. Create hook file in `hooks/` directory
2. Extend corresponding Wagmi hook
3. Add ERC-4337 specific logic
4. Export from index.ts
5. Update types as needed

### Testing Guidelines

- Test with both EOA and smart accounts
- Verify Wagmi compatibility
- Test error scenarios
- Ensure proper type inference