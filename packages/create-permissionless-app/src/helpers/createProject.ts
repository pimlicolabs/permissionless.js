import path from "path"
import { createEnv } from "./createEnv"
import { scaffoldProject } from "./scaffoldProject"
import { selectBoilerplate } from "./selectBolierplate"

interface CreateProjectOptions {
    projectName: string
    bundler: string
    paymaster: string
    signer: string
    accountSystem: string

    pimlicoApiKey: string
    privyAppId: string
    publicRPCUrl: string
}

export const createProject = async ({
    projectName,
    bundler,
    paymaster,
    signer,
    accountSystem,
    privyAppId,
    pimlicoApiKey,
    publicRPCUrl
}: CreateProjectOptions) => {
    const projectDir = path.resolve(process.cwd(), projectName)

    // Bootstraps the base Permissionless application
    await scaffoldProject({
        projectName,
        projectDir
    })

    // Select the appropriate boilerplate based on options
    selectBoilerplate({
        bundler,
        paymaster,
        signer,
        accountSystem,
        projectDir
    })

    createEnv(projectDir, "PRIVY_APP_ID", privyAppId)

    createEnv(projectDir, "RPC_URL", publicRPCUrl)

    createEnv(
        projectDir,
        "PIMLICO_PAYMASTER_RPC_HOST",
        `https://api.pimlico.io/v1/sepolia/rpc?apikey=${pimlicoApiKey}`
    )

    createEnv(
        projectDir,
        "PIMLICO_BUNDLER_RPC_HOST",
        `https://api.pimlico.io/v2/sepolia/rpc?apikey=${pimlicoApiKey}`
    )

    return projectDir
}
