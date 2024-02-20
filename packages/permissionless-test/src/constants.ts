const messages = new Map()

export function warn(message: string) {
    if (!messages.has(message)) {
        messages.set(message, true)
        console.warn(message)
    }
}

export let forkUrl: string
if (process.env.VITE_ANVIL_FORK_URL) {
    forkUrl = process.env.VITE_ANVIL_FORK_URL
} else {
    forkUrl = "https://cloudflare-eth.com"
    warn(`\`VITE_ANVIL_FORK_URL\` not found. Falling back to \`${forkUrl}\`.`)
}

export let forkBlockNumber: bigint
if (process.env.VITE_ANVIL_BLOCK_NUMBER) {
    forkBlockNumber = BigInt(Number(process.env.VITE_ANVIL_BLOCK_NUMBER))
} else {
    forkBlockNumber = 10419392n
    warn(
        `\`VITE_ANVIL_BLOCK_NUMBER\` not found. Falling back to \`${forkBlockNumber}\`.`
    )
}

export let anvilPort: number
if (process.env.VITE_ANVIL_PORT) {
    anvilPort = Number(process.env.VITE_ANVIL_PORT)
} else {
    anvilPort = 8545
    warn(`\`VITE_ANVIL_PORT\` not found. Falling back to \`${anvilPort}\`.`)
}

export const poolId = Number(process.env.VITEST_POOL_ID ?? 1)
export const localHttpUrl = `http://127.0.0.1:${anvilPort}/${poolId}`
export const localWsUrl = `ws://127.0.0.1:${anvilPort}/${poolId}`
