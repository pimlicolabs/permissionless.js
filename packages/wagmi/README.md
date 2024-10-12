<h1 className='vocs_HomePage_title'>@permissionless/wagmi</h1>
  Enable gas sponsorship and transaction batching for your app with just a couple lines of cod.
<br />
<br />
permissionless/wagmi is a TypeScript library built on top of permissionless.js
and wagmi for quickly enabling support for EIP-5792 features on your app,
including gas sponsorship and transaction batching, with just a couple lines of
code. We built @permissionless/wagmi to allow app developers to support the
features of new smart accounts such as Coinbase Smart Wallet without any of the
complexity.

<article className="vocs_Content max-w-4xl mt-[-80px] mx-auto">

# 

# Overview

```tsx [main.tsx]
import { PermissionlessProvider } from "@permissionless/wagmi"; // [!code ++] // [!code focus]

function Main() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PermissionlessProvider // [!code ++] // [!code focus]
          capabilities={capabilities} // [!code ++] // [!code focus]
        >
          // [!code ++] // [!code focus]
          {/** ... */}
        </PermissionlessProvider>{" "}
        // [!code ++] // [!code focus]
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

```tsx [app.tsx]
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi" // [!code --] // [!code focus]
import {  // [!code ++] // [!code focus]
    useSendTransaction,  // [!code ++] // [!code focus]
    useWaitForTransactionReceipt  // [!code ++] // [!code focus]
} from "@permissionless/wagmi"  // [!code ++] // [!code focus]

function App() {
  const {
    sendTransaction, // [!code focus]
    data: transactionReference,
    isPending
  } = useSendTransaction() // [!code focus]
  
  const { data: receipt, isPending: isReceiptPending } = // [!code focus]
    useWaitForTransactionReceipt({ // [!code focus]
      hash: "0x1234" // [!code --] // [!code focus]
      id: transactionReference  // [!code ++] // [!code focus]
    }) // [!code focus]

  const sendTransactionCallback = useCallback(async () => {
    console.log("Sending transaction...")
    sendTransaction({ // [!code focus]
      to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045", // [!code focus]
      data: "0x1234" // [!code focus]
    }) // [!code focus]
  }, [sendTransaction])

}
```

And that's it!

# Features

- **ERC-7677 Paymaster service**: Makes it easier to interact with an external
  smart account that offers support.
- **Sending multiple transactions**: Makes it easier to send multiple
  transactions from an external smart account.
- **Built on & for wagmi**: `@permissionless/wagmi` is designed to be a thin
  wrapper around wagmi, maintaining the same style and overall feel wagmi
  provides.
- and a lot more coming soon...

# Source Code

The source code for `@permissionless/wagmi` is available on
[GitHub](https://github.com/pimlicolabs/permissionless.js)

`@permissionless/wagmi` is distributed under an MIT License.

We welcome contributions from the community. If you would like to contribute,
please open an issue or a pull request.

Feel free to ask any questions in our [Telegram group](https://t.me/pimlicoHQ)

</article>
