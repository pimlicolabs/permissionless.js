import path from "path"
import chalk from "chalk"
import { type StdioOption, execa } from "execa"
import ora, { type Ora } from "ora"

import {
    type PackageManager,
    detectPackageManager
} from "../utils/detectPackageManager"
import { logger } from "../utils/logger"

const runInstallCommand = async (
    projectDir: string,
    packageManager: PackageManager
): Promise<Ora | null> => {
    const spinner = ora(`Running ${packageManager} install...`).start()
    try {
        const stdioOption: StdioOption =
            process.platform === "win32" ? "inherit" : "pipe"
        const { stdout } = await execa(packageManager, ["install"], {
            cwd: projectDir,
            stdio: stdioOption
        })
        spinner.succeed(chalk.cyan(`${stdout.length} packages installed!`))
        return null
    } catch (error) {
        spinner.fail(chalk.red("Failed to install dependencies."))
        console.error(chalk.red("Error:"), error)
        return spinner
    }
}

export const installDependencies = async (projectDir: string) => {
    try {
        const boilerplateDir = path.resolve(process.cwd(), projectDir)
        process.chdir(boilerplateDir)
        logger.info("Installing dependencies...")
        const packageManager: PackageManager = detectPackageManager()
        const installSpinner = await runInstallCommand(
            boilerplateDir,
            packageManager
        )
        if (installSpinner === null) {
            logger.success("Successfully installed all dependencies!")
        } else {
            logger.error("Failed to install dependencies.")
        }
    } catch (error) {
        logger.error("An error occurred:", error)
    }
}
