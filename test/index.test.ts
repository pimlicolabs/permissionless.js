import dotenv from "dotenv"
import { createBundlerClient } from "permissionless"
import { createPimlicoBundlerClient, createPimlicoPaymasterClient } from "permissionless/clients/pimlico"
import { createStackupPaymasterClient } from "permissionless/clients/stackup"
import { http } from "viem"
import { testBundlerActions } from "./bundlerActions.test"
import { testPimlicoBundlerActions, testPimlicoPaymasterActions } from "./pimlicoActions.test"
import { testStackupBundlerActions } from "./stackupActions.test"
import { getTestingChain } from "./utils"

// Load environment variables from .env file
dotenv.config()

if (!process.env.PIMLICO_API_KEY) throw new Error("PIMLICO_API_KEY environment variable not set")
if (!process.env.STACKUP_API_KEY) throw new Error("STACKUP_API_KEY environment variable not set")

const pimlicoApiKey = process.env.PIMLICO_API_KEY
const stackupApiKey = process.env.STACKUP_API_KEY

const main = async () => {
    const chain = getTestingChain()

    const chainName = chain.name.toLowerCase()

    const bundlerClient = createBundlerClient({
        chain: chain,
        transport: http(`https://api.pimlico.io/v1/${chainName}/rpc?apikey=${pimlicoApiKey}`)
    })

    await testBundlerActions(bundlerClient)

    const pimlicoBundlerClient = createPimlicoBundlerClient({
        chain: chain,
        transport: http(`https://api.pimlico.io/v1/${chainName}/rpc?apikey=${pimlicoApiKey}`)
    })
    await testPimlicoBundlerActions(pimlicoBundlerClient)

    const pimlicoPaymasterClient = createPimlicoPaymasterClient({
        chain: chain,
        transport: http(`https://api.pimlico.io/v2/${chainName}/rpc?apikey=${pimlicoApiKey}`)
    })
    await testPimlicoPaymasterActions(pimlicoPaymasterClient, bundlerClient)

    const stackupBundlerClient = createStackupPaymasterClient({
        chain: chain,
        transport: http(`https://api.stackup.sh/v1/paymaster/${stackupApiKey}`)
    })

    await testStackupBundlerActions(stackupBundlerClient, bundlerClient)
}

main()
