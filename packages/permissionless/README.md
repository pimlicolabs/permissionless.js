<p align="center"><a href="https://docs.pimlico/permissionless"><img width="1000" title="Permissionless" src='https://raw.githubusercontent.com/pimlicolabs/permissionless.js/main/assets/banner.png' /></a></p>

# permissionless.js

![Node Version](https://img.shields.io/badge/node-20.x-green)

permissionless.js is a TypeScript library built on top of [viem](https://viem.sh) for deploying and managing [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) smart accounts, interacting with bundlers and paymasters, and leveraging custom signers.

## Features

- **High-Level Smart Account Support**: We support a high-level API for deploying and managing smart accounts, including some of the most popular implementations ([Safe](https://safe.global), [Kernel](https://zerodev.app), [Biconomy](https://biconomy.io), etc.)
- **Bundler Support**: We support all bundler actions following [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337#rpc-methods-eth-namespace).
- **Gas Sponsorship**: We support paymaster actions to allow you to easily sponsor gas fees.
- **User Operation Utility Functions**: We provide many low-level utility functions useful for dealing with User Operations.
- **Modular and Extensible**: We allow you to easily create and plug in your own smart account systems, bundlers, paymasters, and signers.
- **Built on & for viem**: permissionless.js is designed to be a thin wrapper around viem, maintaining the same style and overall feel viem provides.
- and a lot more...

## Documentation

[Take a look at our documentation](https://docs.pimlico.io/permissionless) to learn more about permissionless.js.

## Installation

Install [viem](https://viem.sh) as a peer dependency.

Then install permissionless.js:

```bash
npm install viem permissionless
```

```bash
bun install viem permissionless
```

```bash
yarn add viem permissionless
```

## Quick Start

```typescript
// Import the required modules.
import { createBundlerClient } from "permissionless"
import { sepolia } from "viem/chains"
import { http } from "viem"

// Create the required clients.
const bundlerClient = createBundlerClient({
    chain: sepolia,
    transport: http(`https://api.pimlico.io/v1/sepolia/rpc?apikey=${pimlicoApiKey}`) // Use any bundler url
})

// Consume bundler, paymaster, and smart account actions!
const userOperationReceipt = await bundlerClient.getUserOperationReceipt({
    hash: "0x5faea6a3af76292c2b23468bbea96ef63fb31360848be195748437f0a79106c8"
})
```

## Contributors

For a full explanation of permissionless.js, please visit our [docs page](https://docs.pimlico.io/permissionless)

Build permissionless.js locally with:
```bash
bun run build
```

## License

Distributed under an MIT License. See [LICENSE](./LICENSE) for more information.

## Contact

Feel free to ask any questions in our [Telegram group](https://t.me/pimlicoHQ)
