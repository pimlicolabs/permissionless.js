import path from "path"
import chalk from "chalk"
import { execa } from "execa"
import ora from "ora"
import {
    type PackageManager,
    detectPackageManager
} from "../utils/detectPackageManager"

export const installDependencies = async (projectDir: string) => {
    const boilerplateDir = path.resolve(process.cwd(), projectDir)

    try {
        // Change directory to the generated boilerplate directory
        process.chdir(boilerplateDir)

        // Detect the package manager being used
        const packageManager: PackageManager = detectPackageManager()

        // Start spinner to notify users
        const spinner = ora({
            text: `Installing dependencies using ${packageManager}...`,
            spinner: "dots"
        }).start()

        // Install dependencies using the detected package manager
        await execa(packageManager, ["install"], { stdio: "inherit" })

        // Stop spinner and notify users
        spinner.succeed(chalk.green("Dependencies installed successfully."))
    } catch (error) {
        console.error(
            chalk.red("Failed to install dependencies:"),
            error.message
        )
    }
}
