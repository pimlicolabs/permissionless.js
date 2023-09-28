<p align="center"><a href="https://docs.pimlico/permissionless"><img width="1000" title="Permissionless" src='./assets/banner.png' /></a></p>

# Permissionless.js

![Node Version](https://img.shields.io/badge/node-20.x-green)

Permissionless.js is a Typescript library built on top of [viem](https://viem.sh) for interacting with [ERC-4337 bundlers](https://eips.ethereum.org/EIPS/eip-4337) and paymasters.

## Features

- **Full ERC-4337 Support**: We support all bundler actions following [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337#rpc-methods-eth-namespace).
- **Gas Sponsorship**: We support paymaster actions to allow you to easily sponsor gas fees.
- **Built on & for Viem**: We provide convenient helper functions like `createBundlerClient` to easily create Viem clients.
- More to come soon...

## Overview

## Installation

Install [viem](https://viem.sh) as a peer dependency

```bash
npm install viem permissionless
```

## Quick start

Create a bundler client, and start sending user operations!

```typescript

import { createBundlerClient } from "permissionless/clients/pimlico"
import { goerli } from "viem/chains"
import { http } from "viem"

const bundlerClient = createBundlerClient({
    chain: goerli,
    transport: http(`https://api.pimlico.io/v1/goerli/rpc?apikey=${pimlicoApiKey}`) // Use any bundler url
})

const userOpHash = await bundlerClient.sendUserOperation({
    userOperation: signedUserOperation,
    entryPoint: entryPoint
})
```

For detailed documentation visit our [docs page](https://docs.pimlico.io/permissionless).


## Contributors

For a full explanation of Permissionless.js, please visit our [docs page](https://docs.pimlico.io/permissionless)

Build permissionless.js locally with:
```bash
bun install permissionless
```

## License

Distributed under an MIT License. See [LICENSE](./LICENSE) for more information.

## Contact

Feel free to ask any questions in our [Telegram group](https://t.me/pimlicoHQ)