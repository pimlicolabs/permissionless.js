# Permissionless.js Monorepo Codebase Analysis

## Overview

Permissionless.js is a comprehensive TypeScript monorepo for building with ERC-4337 (Account Abstraction). It provides a complete ecosystem of packages for creating and managing smart accounts, integrating with React applications, and testing account abstraction features locally.

## Monorepo Structure

### Package Organization

```
permissionless.js/
├── packages/
│   ├── permissionless/      # Core ERC-4337 library
│   ├── permissionless-test/ # Internal testing utilities
│   ├── wagmi/              # React hooks for Wagmi integration
│   ├── wagmi-demo/         # Demo application
│   └── mock-paymaster/     # Local testing utilities
├── tsconfig/               # Shared TypeScript configurations
├── .changeset/             # Version management
└── [root config files]     # Monorepo configuration
```

### Package Relationships

```mermaid
graph TD
    A[permissionless] --> B[@permissionless/wagmi]
    A --> C[wagmi-demo]
    D[@pimlico/mock-paymaster] --> C
    B --> C
    E[permissionless-test] --> A
    E --> D
```

## Technology Stack

### Core Technologies

- **TypeScript**: Strict mode across all packages
- **Bun**: Package manager and workspace management
- **Viem**: Core Ethereum library
- **React**: For UI packages (wagmi, wagmi-demo)
- **Vitest**: Testing framework
- **Biome**: Code formatting and linting

### Build System

- **Workspace-based builds**: Each package builds independently
- **Multiple output formats**: CJS, ESM, and TypeScript declarations
- **tsc-alias**: Path alias resolution
- **Size-limit**: Bundle size monitoring

## Package Descriptions

### 1. permissionless (Core Library)

The foundational package providing:
- Smart account implementations (Safe, Kernel, Biconomy, etc.)
- ERC-4337 actions and utilities
- Bundler and paymaster integrations
- Type-safe abstractions over account abstraction

**Key Features:**
- 10+ smart account implementations
- Modular action system
- Comprehensive type safety
- Entry point v0.6 and v0.7 support

### 2. @permissionless/wagmi

React integration layer:
- Enhanced Wagmi hooks for ERC-4337
- Context providers for configuration
- Seamless smart account support
- Maintains Wagmi's developer experience

**Key Features:**
- Drop-in Wagmi enhancement
- Transaction sending with smart accounts
- Capability detection
- Observable state management

### 3. wagmi-demo

Demonstration application:
- Live examples of all features
- Passkey authentication demos
- Best practice implementations
- Educational resource

**Key Features:**
- Interactive demos
- Real-world usage patterns
- Error handling examples
- UI/UX best practices

### 4. @pimlico/mock-paymaster

Local testing infrastructure:
- Mock paymaster server
- Prool integration
- ERC20 token deployment
- Development environment setup

**Key Features:**
- Zero-config local testing
- Fastify-based RPC server
- Contract deployment utilities
- CORS-enabled endpoints

### 5. permissionless-test (Internal)

Testing utilities package:
- Complete ERC-4337 test infrastructure
- Smart account factory functions
- RPC test fixtures for Vitest
- Mock AA infrastructure setup

**Key Features:**
- Automated test environment setup
- Support for all account types
- Dynamic port allocation
- Fork mode support

## Development Workflow

### Monorepo Management

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun test

# Start development
bun dev
```

### Package Scripts

Each package has standard scripts:
- `build`: Compile TypeScript to multiple formats
- `test`: Run package tests
- `dev`: Start development mode
- `lint`: Check code quality

### Version Management

Uses Changesets for coordinated releases:
1. Create changeset for changes
2. Version packages together
3. Publish to npm registry
4. Maintain changelog

## Coding Standards

### Consistent Patterns Across Packages

1. **No Comments Policy**: Self-documenting code
2. **Type Safety**: Strict TypeScript everywhere
3. **Async/Await**: Preferred over promises
4. **Early Returns**: For error conditions
5. **Const by Default**: Immutable values

### Import/Export Conventions

- Index files for clean exports
- Type imports using `type` keyword
- `.js` extensions for ESM compatibility
- Workspace dependencies for internal packages

### Testing Strategy

- Unit tests with Vitest
- Integration tests with local chains
- Coverage reporting with V8
- Concurrent test execution where possible

## Architecture Principles

### 1. Modularity

Each package serves a specific purpose:
- Core functionality separated from integrations
- UI components isolated from business logic
- Testing utilities independent of main code

### 2. Type Safety

Comprehensive TypeScript usage:
- Strict mode enabled
- Generic types for flexibility
- Conditional types for version compatibility
- No `any` types

### 3. Developer Experience

Focus on ease of use:
- Intuitive APIs
- Comprehensive examples
- Clear error messages
- Minimal configuration

### 4. Extensibility

Easy to extend and customize:
- Plugin architecture for accounts
- Composable actions
- Override capabilities
- Custom implementations

## Build Configuration

### TypeScript Setup

Shared base configuration with package-specific overrides:
- Target: ES2021 for Node 16+ compatibility
- Lib: ES2022 + DOM for modern features
- Module: ESNext for tree-shaking
- Strict checks enabled

### Output Formats

Each package builds to:
1. **CommonJS** (`_cjs/`): Node.js compatibility
2. **ESM** (`_esm/`): Modern bundlers
3. **Types** (`_types/`): TypeScript support

## Quality Assurance

### Code Quality Tools

- **Biome**: Fast formatting and linting
- **TypeScript**: Type checking
- **Size-limit**: Bundle size monitoring
- **Changesets**: Version management

### Testing Infrastructure

- **Vitest**: Test runner
- **Prool**: Local blockchain testing
- **Coverage**: V8 coverage reports
- **Integration tests**: Real chain interactions

## Contributing Guidelines

### Adding New Features

1. Determine appropriate package
2. Follow existing patterns
3. Add comprehensive tests
4. Update types and exports
5. Create changeset

### Package Development

1. Use workspace dependencies
2. Maintain package independence
3. Follow naming conventions
4. Document in agents.md
5. Add to monorepo scripts

### Code Review Focus

- Type safety
- API consistency
- Test coverage
- Bundle size impact
- Breaking changes

## Future Architecture Considerations

### Scalability

- Additional smart account types
- New chain integrations
- Enhanced testing tools
- Performance optimizations

### Maintainability

- Clear separation of concerns
- Consistent coding patterns
- Comprehensive documentation
- Automated quality checks