import type { CreatePoolOptions, Pool } from "@viem/anvil"
import { type Alto, type CreateAltoOptions, createAlto } from "./createAlto"

export type CustomPool<TKey = number> = Pool<TKey> & {
    start(id: TKey, options?: CreateAltoOptions): Promise<Alto>
}

/**
 * Creates pool of anvil instances.
 */
export function createAltoPool<TKey = number>({
    instanceLimit,
    autoPort = true
}: CreatePoolOptions = {}): CustomPool<TKey> {
    const instances = new Map<TKey, Promise<Alto>>()

    async function start(id: TKey, options?: CreateAltoOptions) {
        if (instances.has(id)) {
            throw new Error(`Anvil instance with id "${id}" already exists`)
        }

        if (instanceLimit !== undefined && instances.size + 1 > instanceLimit) {
            throw new Error(`Anvil instance limit of ${instanceLimit} reached`)
        }

        // biome-ignore lint/suspicious/noAsyncPromiseExecutor: this is fine ...
        const anvil = new Promise<Alto>(async (resolve, reject) => {
            try {
                const opts = {
                    ...options,
                    ...(options?.port === undefined && autoPort
                        ? {
                              port: await (await import("get-port")).default()
                          }
                        : {})
                }

                const instance = createAlto(opts)
                await instance.start()

                resolve(instance)
            } catch (error) {
                reject(error)
            }
        })

        instances.set(id, anvil)

        return anvil
    }

    async function stop(id: TKey) {
        const anvil = instances.get(id)
        if (anvil === undefined) {
            return
        }

        instances.delete(id)

        // If the anvil instance hasn't even started, we don't attempt to stop it.
        return anvil.catch(() => undefined).then((anvil) => anvil?.stop())
    }

    async function empty() {
        const array = Array.from(instances.keys())
        const result = await Promise.allSettled(array.map((id) => stop(id)))

        if (result.some(({ status }) => status === "rejected")) {
            throw new Error("Failed to gracefully stop some instances")
        }
    }

    return {
        get size() {
            return instances.size
        },
        instances: () => instances.entries(),
        has: (id: TKey) => instances.has(id),
        get: (id: TKey) => instances.get(id),
        start,
        stop,
        empty
    }
}
