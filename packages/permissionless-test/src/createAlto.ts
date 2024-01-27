import { EventEmitter } from "node:events"
import { Writable } from "node:stream"
import type { ExecaChildProcess } from "execa"

export type CreateAltoOptions = {
    port?: number
    host?: string
    startTimeout?: number
    stopTimeout?: number
    dockerBinary?: string
    anvilHost?: string
    anvilPort?: number
}

export type Alto = {
    /**
     * Starts the anvil instance.
     *
     * @returns A promise that resolves when the instance has started.
     * @throws If the instance didn't start gracefully.
     */
    start(): Promise<void>
    /**
     * Stops the anvil instance.
     *
     * @returns A promise that resolves when the instance has stopped.
     * @throws If the instance didn't stop gracefully.
     */
    stop(): Promise<void>
    /**
     * Subscribe to events of the anvil instance.
     *
     * @param event The event to subscribe to.
     * @param listener The listener to call when the event is emitted.
     */
    on(event: "message", listener: (message: string) => void): () => void
    on(event: "stderr", listener: (message: string) => void): () => void
    on(event: "stdout", listener: (message: string) => void): () => void
    on(event: "closed", listener: () => void): () => void
    on(
        event: "exit",
        listener: (code?: number, signal?: NodeJS.Signals) => void
    ): () => void
    /**
     * The current status of the anvil instance.
     */
    readonly status: "idle" | "starting" | "stopping" | "listening"
    /**
     * The most recent logs of the anvil instance.
     */
    readonly logs: string[]
    /**
     * The port the anvil instance is configured to listen on.
     */
    readonly port: number
    /**
     * The host the anvil instance is configured to listen on.
     */
    readonly host: string
    /**
     * The options which the anvil instance was created with.
     */
    readonly options: CreateAltoOptions
}

export function createAlto(options: CreateAltoOptions = {}): Alto {
    const emitter = new EventEmitter()
    const logs: string[] = []

    emitter.on("message", (message: string) => {
        logs.push(message)

        if (logs.length > 20) {
            logs.shift()
        }
    })

    let anvil: ExecaChildProcess | undefined
    let controller: AbortController | undefined
    let status: "idle" | "starting" | "stopping" | "listening" = "idle"

    const {
        anvilBinary = "anvil",
        dockerBinary = "docker",
        startTimeout = 10_000,
        stopTimeout = 10_000,
        ...anvilOptions
    } = options

    const stdout = new Writable({
        write(chunk, _, callback) {
            try {
                const message = chunk.toString()
                emitter.emit("message", message)
                emitter.emit("stdout", message)
                callback()
            } catch (error) {
                callback(
                    error instanceof Error
                        ? error
                        : new Error(
                              typeof error === "string" ? error : undefined
                          )
                )
            }
        }
    })

    const stderr = new Writable({
        write(chunk, _, callback) {
            try {
                const message = chunk.toString()
                emitter.emit("message", message)
                emitter.emit("stderr", message)
                callback()
            } catch (error) {
                callback(
                    error instanceof Error
                        ? error
                        : new Error(
                              typeof error === "string" ? error : undefined
                          )
                )
            }
        }
    })

    async function start() {
        if (status !== "idle") {
            throw new Error("Anvil instance not idle")
        }

        status = "starting"

        // biome-ignore lint/suspicious/noAsyncPromiseExecutor: this is fine ...
        return new Promise<void>(async (resolve, reject) => {
            let log: string | undefined = undefined

            async function setFailed(reason: Error) {
                status = "stopping"

                clearTimeout(timeout)
                emitter.off("message", onMessage)
                emitter.off("exit", onExit)

                try {
                    if (
                        controller !== undefined &&
                        !controller?.signal.aborted
                    ) {
                        controller.abort()
                    }

                    await anvil
                } catch {}

                status = "idle"
                reject(reason)
            }

            function setStarted() {
                status = "listening"

                clearTimeout(timeout)
                emitter.off("message", onMessage)
                emitter.off("exit", onExit)

                resolve()
            }

            function onExit() {
                if (status === "starting") {
                    if (log !== undefined) {
                        setFailed(new Error(`Anvil exited: ${log}`))
                    } else {
                        setFailed(new Error("Anvil exited"))
                    }
                }
            }

            function onMessage(message: string) {
                log = message

                if (status === "starting") {
                    const host = options.host ?? "127.0.0.1"
                    const port = options.port ?? 8545

                    // We know that anvil is listening when it prints this message.
                    if (message.includes(`Listening on ${host}:${port}`)) {
                        setStarted()
                    }
                }
            }

            emitter.on("exit", onExit)
            emitter.on("message", onMessage)

            const timeout = setTimeout(() => {
                setFailed(new Error("Anvil failed to start in time"))
            }, startTimeout)

            controller = new AbortController()

            const { execa } = await import("execa")

            const dockerPull = await execa(
                dockerBinary,
                [
                    "pull",
                    "ghcr.io/pimlicolabs/alto/tmp:main-bd59c7b-1705755233"
                ],
                {}
            )

            console.log(dockerPull)

            anvil = execa(anvilBinary, toArgs(anvilOptions), {
                signal: controller.signal,
                cleanup: true
            })

            anvil.on("closed", () => emitter.emit("closed"))
            anvil.on("exit", (code, signal) => {
                emitter.emit("exit", code ?? undefined, signal ?? undefined)
            })

            // biome-ignore lint/style/noNonNullAssertion: this is guaranteed to be defined
            anvil.pipeStdout!(stdout)
            // biome-ignore lint/style/noNonNullAssertion: this is guaranteed to be defined
            anvil.pipeStderr!(stderr)
        })
    }

    async function stop() {
        if (status === "idle") {
            return
        }

        const timeout = new Promise<void>((_, reject) => {
            setTimeout(() => {
                reject(new Error("Anvil failed to stop in time"))
            }, stopTimeout)
        })

        const closed = new Promise<void>((resolve) => {
            anvil?.once("close", () => resolve())
        })

        try {
            if (controller !== undefined && !controller?.signal.aborted) {
                controller.abort()
            }

            await anvil
        } catch {}

        status = "idle"
        anvil = undefined
        controller = undefined

        return Promise.race([closed, timeout])
    }

    return {
        start,
        stop,
        // rome-ignore lint/suspicious/noExplicitAny: typed via the return type
        on: (event: string, listener: any) => {
            emitter.on(event, listener)

            return () => {
                emitter.off(event, listener)
            }
        },
        get status() {
            return status
        },
        get logs() {
            return logs.slice()
        },
        get port() {
            return options.port ?? 8545
        },
        get host() {
            return options.host ?? "127.0.0.1"
        },
        get options() {
            // NOTE: This is effectively a safe, readonly copy because the options are a flat object.
            return { ...options }
        }
    }
}
