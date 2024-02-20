import path from "path"
import { fileURLToPath } from "url"
import * as p from "@clack/prompts"
import chalk from "chalk"
import fs from "fs-extra"
import ora from "ora"

export interface ScaffoldOptions {
    projectDir: string
    projectName: string
}

const __filename = fileURLToPath(import.meta.url)
const distPath = path.dirname(__filename)
const PKG_ROOT = path.join(distPath, "../../")

// This bootstraps the base Permissionless application
export const scaffoldProject = async ({
    projectName,
    projectDir
}: ScaffoldOptions) => {
    const templateDir = path.join(PKG_ROOT, "template/base")

    const spinner = ora(`Scaffolding in: ${projectDir}...\n`).start()

    if (fs.existsSync(projectDir)) {
        if (fs.readdirSync(projectDir).length === 0) {
            if (projectName !== ".")
                spinner.info(
                    `${chalk.cyan.bold(
                        projectName
                    )} exists but is empty, continuing...\n`
                )
        } else {
            spinner.stopAndPersist()
            const overwriteDir = await p.select({
                message: `${chalk.redBright.bold("Warning:")} ${chalk.cyan.bold(
                    projectName
                )} already exists and isn't empty. How would you like to proceed?`,
                options: [
                    {
                        label: "Abort installation (recommended)",
                        value: "abort"
                    },
                    {
                        label: "Clear the directory and continue installation",
                        value: "clear"
                    },
                    {
                        label: "Continue installation and overwrite conflicting files",
                        value: "overwrite"
                    }
                ],
                initialValue: "abort"
            })
            if (overwriteDir === "abort") {
                spinner.fail("Aborting installation...")
                process.exit(1)
            }

            const overwriteAction =
                overwriteDir === "clear"
                    ? "clear the directory"
                    : "overwrite conflicting files"

            const confirmOverwriteDir = await p.confirm({
                message: `Are you sure you want to ${overwriteAction}?`,
                initialValue: false
            })

            if (!confirmOverwriteDir) {
                spinner.fail("Aborting installation...")
                process.exit(1)
            }

            if (overwriteDir === "clear") {
                spinner.info(
                    `Emptying ${chalk.cyan.bold(
                        projectName
                    )} and creating permissionless app..\n`
                )
                fs.rmSync(projectDir)
            }
        }
    }

    spinner.start()

    try {
        // Copy the entire template/base directory to the target directory
        fs.copySync(templateDir, projectDir)

        const scaffoldedName =
            projectName === "." ? "App" : chalk.cyan.bold(projectName)

        spinner.succeed(
            `${scaffoldedName} ${chalk.green("scaffolded successfully!")}\n`
        )
    } catch (err) {
        spinner.fail(`${chalk.red.bold("Error:")} ${err.message}`)
        process.exit(1)
    }
}
