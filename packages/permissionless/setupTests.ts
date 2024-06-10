import { createServer } from "prool"
import { anvil } from "prool/instances"

const anvilServer = createServer({
    instance: anvil({
        chainId: 1
    }),
    limit: 5,
    port: 8485
})

export const setup = async () => {
    await anvilServer.start()
}

export const teardown = async () => {
    console.log("teardown")
    await anvilServer.stop()
}
