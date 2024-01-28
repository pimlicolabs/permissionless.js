import { Pool, createAnvil } from "@viem/anvil"

import { forkBlockNumber, forkUrl } from "./src/constants.js"
import { Alto, createAlto } from "./src/createAlto.js"

export default async function () {
    if (process.env.SKIP_GLOBAL_SETUP) return

    const anvil = createAnvil({
        forkUrl: forkUrl,
        forkBlockNumber: forkBlockNumber
    })

    let alto: Alto | undefined

    anvil.on("message", () => {
        if (anvil.status === "listening") {
            alto = createAlto({
                anvilPort: anvil.port,
                anvilHost: anvil.options.host
            })
        }
    })

    return () => {
        anvil.stop()
        if (alto) alto.stop()
    }
}
