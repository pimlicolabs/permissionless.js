# Wagmi Demo Application Codebase Analysis

## Overview

Wagmi Demo is a React demonstration application showcasing the integration of Permissionless.js with Wagmi. It provides working examples of ERC-4337 account abstraction features, including passkey authentication and smart account interactions.

## Project Structure

### Directory Organization

```
packages/wagmi-demo/
├── src/
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   ├── wagmi.ts             # Wagmi configuration
│   ├── PasskeysDemo.tsx     # Passkey authentication demo
│   ├── PasskeyServerDemo.tsx # Server-based passkey demo
│   └── vite-env.d.ts        # Vite type definitions
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # Node TypeScript config
├── vite.config.ts           # Vite configuration
└── biome.json               # Code formatter configuration
```

## Technology Stack

### Core Dependencies

- **React**: UI framework
- **Vite**: Build tool and dev server
- **TypeScript**: Type-safe development
- **permissionless**: Core ERC-4337 library (workspace dependency)
- **@permissionless/wagmi**: Wagmi integration (workspace dependency)
- **wagmi**: React hooks for Ethereum
- **viem**: Ethereum library

### Development Tools

- **Biome**: Code formatting and linting
- **Vite**: Fast development server with HMR

## Application Features

### 1. Passkey Authentication Demo

Demonstrates WebAuthn-based authentication:
- Create smart accounts with passkeys
- Sign transactions with biometric authentication
- No seed phrases required

### 2. Passkey Server Demo

Shows server-assisted passkey flows:
- Server-side passkey validation
- Enhanced security patterns
- Integration with backend services

### 3. Smart Account Interactions

Examples of ERC-4337 operations:
- Account creation and deployment
- User operation submission
- Paymaster integration
- Bundler interactions

## Coding Patterns and Conventions

### 1. Component Structure

React functional components with hooks:

```typescript
export function DemoComponent() {
    // Hook usage
    // Event handlers
    // Render logic
}
```

### 2. Wagmi Configuration

Centralized configuration in wagmi.ts:

```typescript
const config = createConfig({
    // Chain configuration
    // Transport setup
    // Connector configuration
})
```

### 3. Demo Pattern

Each demo is self-contained:
- Clear user instructions
- Error handling and feedback
- Loading states
- Success confirmations

### 4. Code Style

- **No comments** unless absolutely necessary
- Descriptive component and function names
- Consistent JSX formatting
- TypeScript for all files

## Architecture

### Application Architecture

1. **Main App**: Route and component management
2. **Demo Components**: Individual feature demonstrations
3. **Wagmi Provider**: Configuration and context
4. **Permissionless Integration**: Smart account functionality

### State Management

- React hooks for local state
- Wagmi hooks for blockchain state
- No external state management library

## Key Design Principles

1. **Educational**: Clear demonstrations of features
2. **User-Friendly**: Intuitive UI with helpful feedback
3. **Real-World**: Practical implementation examples
4. **Best Practices**: Shows recommended patterns
5. **Error Handling**: Graceful failure scenarios

## Development Workflow

### Running the Demo

```bash
bun dev        # Start development server
bun build      # Build for production
bun preview    # Preview production build
```

### Adding New Demos

1. Create new component in `src/`
2. Implement demo functionality
3. Add to App.tsx routing
4. Include error handling
5. Add user instructions

### Demo Guidelines

- Keep demos focused on single features
- Provide clear user instructions
- Show loading and success states
- Handle errors gracefully
- Use realistic scenarios

## User Experience

### UI Patterns

- Clear call-to-action buttons
- Loading indicators during async operations
- Success/error messages
- Step-by-step guidance
- Responsive design

### Error Handling

- User-friendly error messages
- Retry mechanisms where appropriate
- Fallback options
- Debug information in development