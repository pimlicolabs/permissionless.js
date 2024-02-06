// import fs from "fs";
import path from "path"
import { scaffoldProject } from "./scaffoldProject"
import { selectBoilerplate } from "./selectBolierplate"

interface CreateProjectOptions {
    projectName: string
    bundler: string
    paymaster: string
    signer: string
    accountSystem: string
}

export const createProject = async ({
    projectName,
    bundler,
    paymaster,
    signer,
    accountSystem
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

    return projectDir
}
