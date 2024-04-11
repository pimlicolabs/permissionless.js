import { warn } from "./constants"

export let forkUrlOptimism: string
if (process.env.VITE_ANVIL_FORK_URL_OPTIMISM) {
    forkUrlOptimism = process.env.VITE_ANVIL_FORK_URL_OPTIMISM
} else {
    forkUrlOptimism = "https://mainnet.optimism.io"
    warn(
        `\`VITE_ANVIL_FORK_URL_OPTIMISM\` not found. Falling back to \`${forkUrlOptimism}\`.`
    )
}

export let forkBlockNumberOptimism: bigint
if (process.env.VITE_ANVIL_BLOCK_NUMBER_OPTIMISM) {
    forkBlockNumberOptimism = BigInt(
        Number(process.env.VITE_ANVIL_BLOCK_NUMBER_OPTIMISM)
    )
} else {
    forkBlockNumberOptimism = BigInt(115197387)
    warn(
        `\`VITE_ANVIL_BLOCK_NUMBER_OPTIMISM\` not found. Falling back to \`${forkBlockNumberOptimism}\`.`
    )
}

export let anvilPortOptimism: number
if (process.env.VITE_ANVIL_PORT_OPTIMISM) {
    anvilPortOptimism = Number(process.env.VITE_ANVIL_PORT_OPTIMISM)
} else {
    anvilPortOptimism = 8645
    warn(
        `\`VITE_ANVIL_PORT_OPTIMISM\` not found. Falling back to \`${anvilPortOptimism}\`.`
    )
}

export const poolId = Number(process.env.VITEST_POOL_ID ?? 1)
export const localHttpUrlOptimism = `http://127.0.0.1:${anvilPortOptimism}/${poolId}`
export const localWsUrlOptimism = `ws://127.0.0.1:${anvilPortOptimism}/${poolId}`
