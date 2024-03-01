import path from "path"
import { fileURLToPath } from "url"
import chalk from "chalk"
import fs from "fs-extra"
import ora, { type Ora } from "ora"
import { logger } from "../utils/logger"

interface SelectBoilerplateOptions {
    bundler: string
    paymaster: string
    signer: string
    accountSystem: string
    projectDir: string
}

// Helper function to copy files
const copyFiles = (sourceDir: string, destinationDir: string) => {
    fs.copySync(sourceDir, destinationDir, { overwrite: true })
}

// Helper function to overwrite file content
const overwriteFileContent = (sourceFile: string, destinationFile: string) => {
    const content = fs.readFileSync(sourceFile, "utf-8")
    fs.writeFileSync(destinationFile, content)
}

// Function to update index.ts files in target directory
const updateIndexFile = (dirPath: string, moduleName: string) => {
    const indexPath = path.join(dirPath, "index.ts")
    try {
        let indexContent = ""

        // Check if the index.ts file exists
        if (fs.existsSync(indexPath)) {
            // Read the existing index.ts file
            indexContent = fs.readFileSync(indexPath, "utf-8")

            // Find the position to insert the new import statements
            const exportIndex = indexContent.indexOf("export {")

            // Append import statement to indexContent after the existing imports
            indexContent = `${indexContent.slice(0, exportIndex).trim()}
            import { ${moduleName} } from "./${moduleName}"
            ${indexContent.slice(exportIndex)}`.trim()
        } else {
            // If the file doesn't exist, create it with the import statement
            indexContent = `import { ${moduleName} } from "./${moduleName}"\n`
            indexContent += `export { ${moduleName} }`
        }

        // Update export statement to include the new module
        indexContent = indexContent.replace(
            /export\s*{\s*([^}]*)\s*}/,
            (_, existingExports) => {
                const exportsArray = existingExports
                    .split(",")
                    .map((e) => e.trim())
                if (!exportsArray.includes(moduleName)) {
                    exportsArray.push(moduleName)
                }
                return `\nexport { ${exportsArray.join(", ")} }`
            }
        )

        fs.writeFileSync(indexPath, indexContent)
    } catch (error) {
        console.error(
            `Error updating index file for ${moduleName}: ${error.message}`
        )
    }
}

// Use import.meta.url to get the current module file path
const __filename = fileURLToPath(import.meta.url)
// Use path.dirname to get the currrent directory path
const moduleDir = path.dirname(__filename)

const templateExtrasDir = path.resolve(moduleDir, "../../template/extras")

// Select bundler-specific files
const selectBundlerConfigFile = (
    bundler: string,
    generatedBoilerplateDir: string,
    spinner: Ora
) => {
    try {
        const sourcePath = path.join(
            templateExtrasDir,
            "bundler",
            bundler,
            "config.ts"
        )
        const destinationPath = path.join(
            generatedBoilerplateDir,
            "src",
            "config",
            `${bundler}BundlerConfig.ts`
        )
        const indexSource = path.join(generatedBoilerplateDir, "src", "config")

        // Check if the source path exists before copying
        if (fs.existsSync(sourcePath)) {
            // Ensure the destination directory exists before copying
            fs.ensureDirSync(path.dirname(destinationPath))

            copyFiles(sourcePath, destinationPath)
            updateIndexFile(indexSource, `${bundler}BundlerConfig`)

            spinner.succeed(
                chalk.green(
                    `Successfully setup boilerplate for ${chalk.green.bold(
                        bundler
                    )} bundler!`
                )
            )
        } else {
            spinner.fail(
                chalk.red(
                    `Bundler config files not found for: ${chalk.green.bold(
                        bundler
                    )}!`
                )
            )
        }
    } catch (error) {
        logger.error(`Error selecting bundler files: ${error.message}`)
    }
}

// Select paymaster-specific files
const selectPaymasterConfigFile = (
    paymaster: string,
    generatedBoilerplateDir: string,
    spinner: Ora
) => {
    try {
        const sourcePath = path.join(
            templateExtrasDir,
            "paymaster",
            paymaster,
            "config.ts"
        )
        const destinationPath = path.join(
            generatedBoilerplateDir,
            "src",
            "config",
            `${paymaster}PaymasterConfig.ts`
        )
        const indexSource = path.join(generatedBoilerplateDir, "src", "config")

        // Check if the source path exists before copying
        if (fs.existsSync(sourcePath)) {
            // Ensure the destination directory exists before copying
            fs.ensureDirSync(path.dirname(destinationPath))

            copyFiles(sourcePath, destinationPath)
            updateIndexFile(indexSource, `${paymaster}PaymasterConfig`)

            spinner.succeed(
                chalk.green(
                    `Successfully setup boilerplate for ${chalk.green.bold(
                        paymaster
                    )} paymaster!`
                )
            )
        } else {
            spinner.fail(
                chalk.red(
                    `Paymaster config files not found for: ${chalk.green.bold(
                        paymaster
                    )}!`
                )
            )
        }
    } catch (error) {
        logger.error(`Error selecting bundler file: ${error.message}`)
    }
}

// Select signer-specific files
const selectSignerConfigFile = (
    signer: string,
    generatedBoilerplateDir: string,
    spinner: Ora
) => {
    try {
        const sourcePath = path.join(
            templateExtrasDir,
            "signer",
            signer,
            "config.ts"
        )
        const destinationPath = path.join(
            generatedBoilerplateDir,
            "src",
            "config",
            `${signer}Config.ts`
        )

        const indexSource = path.join(generatedBoilerplateDir, "src", "config")

        // Check if the source path exists before copying
        if (fs.existsSync(sourcePath)) {
            // Ensure the destination directory exists before copying
            fs.ensureDirSync(path.dirname(destinationPath))

            copyFiles(sourcePath, destinationPath)
            updateIndexFile(indexSource, `${signer}Config`)

            spinner.succeed(
                chalk.green(
                    `Successfully setup config for ${chalk.green.bold(
                        signer
                    )} signer!`
                )
            )
        } else {
            spinner.fail(
                chalk.red(
                    `Config files not found for:  ${chalk.green.bold(
                        signer
                    )} signer!`
                )
            )
        }
    } catch (error) {
        logger.error(`Error selecting signer config file: ${error.message}`)
    }
}

// Select _app.tsx content
const selectAppFile = (
    signer: string,
    generatedBoilerplateDir: string,
    spinner: Ora
) => {
    try {
        const sourcePath = path.join(
            templateExtrasDir,
            "pages",
            "_app",
            `with-${signer}.tsx`
        )

        const destinationPath = path.join(
            generatedBoilerplateDir,
            "src",
            "pages",
            "_app.tsx"
        )

        // Check if the source path exists before copying
        if (fs.existsSync(sourcePath)) {
            // Ensure the destination directory exists before copying
            fs.ensureDirSync(path.dirname(destinationPath))

            overwriteFileContent(sourcePath, destinationPath)

            spinner.succeed(
                chalk.green(
                    `Successfully setup App component for ${chalk.green.bold(
                        signer
                    )} signer!`
                )
            )
        } else {
            spinner.fail(
                chalk.red(
                    `App file not found for:  ${chalk.green.bold(
                        signer
                    )} signer!`
                )
            )
        }
    } catch (error) {
        logger.error(`Error selecting App file: ${error.message}`)
    }
}

const selectComponentFile = (
    signer: string,
    generatedBoilerplateDir: string,
    spinner: Ora
) => {
    try {
        const sourcePath = path.join(
            templateExtrasDir,
            "components",
            signer,
            "PrivyAuth.tsx"
        )

        const destinationPath = path.join(
            generatedBoilerplateDir,
            "src",
            "components",
            "PrivyAuth.tsx"
        )

        const indexSource = path.join(
            generatedBoilerplateDir,
            "src",
            "components"
        )

        // Check if the source path exists before copying
        if (fs.existsSync(sourcePath)) {
            // Ensure the destination directory exists before copying
            fs.ensureDirSync(path.dirname(destinationPath))

            copyFiles(sourcePath, destinationPath)
            updateIndexFile(indexSource, "PrivyAuth")

            spinner.succeed(
                chalk.green(
                    `Successfully add necessary components for ${chalk.green.bold(
                        signer
                    )} signer!`
                )
            )
        } else {
            spinner.fail(
                chalk.red(
                    `Component files not found for:  ${chalk.green.bold(
                        signer
                    )} signer!`
                )
            )
        }
    } catch (error) {
        logger.error(`Error selecting Component files: ${error.message}`)
    }
}

// Select index.tsx content
const selectIndexFile = (
    signer: string,
    generatedBoilerplateDir: string,
    spinner: Ora
) => {
    try {
        const sourcePath = path.join(
            templateExtrasDir,
            "pages",
            "index",
            `with-${signer}.tsx`
        )
        const destinationPath = path.join(
            generatedBoilerplateDir,
            "src",
            "pages",
            "index.tsx"
        )

        // Check if the source path exists before copying
        if (fs.existsSync(sourcePath)) {
            // Ensure the destination directory exists before copying
            fs.ensureDirSync(path.dirname(destinationPath))

            overwriteFileContent(sourcePath, destinationPath)

            spinner.succeed(
                chalk.green(
                    `Successfully setup index file for ${chalk.green.bold(
                        signer
                    )} signer!`
                )
            )
        } else {
            spinner.fail(
                chalk.red(
                    `Index file not found for:  ${chalk.green.bold(
                        signer
                    )} signer!`
                )
            )
        }
    } catch (error) {
        logger.error(`Error selecting Index file: ${error.message}`)
    }
}

// Select signer-specific hooks
const selectSignerHooks = (
    signer: string,
    accountSystem: string,
    generatedBoilerplateDir: string,
    spinner: Ora
) => {
    try {
        if (signer === "privy" && accountSystem === "safe") {
            const sourceHookFile = path.join(
                templateExtrasDir,
                "signer",
                signer,
                "hooks",
                "usePrivyAuthWithSafeAccount.ts"
            )

            const destinationHookFile = path.join(
                generatedBoilerplateDir,
                "src",
                "hooks",
                "usePrivyAuth.ts"
            )

            const indexSource = path.join(
                generatedBoilerplateDir,
                "src",
                "hooks"
            )

            if (fs.existsSync(sourceHookFile)) {
                // Ensure the destination directory exists before copying
                fs.ensureDirSync(path.dirname(destinationHookFile))

                overwriteFileContent(sourceHookFile, destinationHookFile)
                updateIndexFile(indexSource, "usePrivyAuth")

                spinner.succeed(
                    chalk.green(
                        `Successfully add necessary hooks for ${chalk.green.bold(
                            signer
                        )} signer!`
                    )
                )
            } else {
                spinner.fail(
                    chalk.red(
                        `Hooks not found for:  ${chalk.green.bold(
                            signer
                        )} signer!`
                    )
                )
            }
        }
    } catch (error) {
        logger.error(`Failed to select signer hooks: ${error.message}`)
    }
}

// Main function to select boilerplate
export const selectBoilerplate = ({
    bundler,
    paymaster,
    signer,
    accountSystem,
    projectDir
}: SelectBoilerplateOptions) => {
    try {
        logger.info("Setting up boilerplate...")
        const generatedBoilerplateDir = path.resolve(process.cwd(), projectDir)
        const spinner = ora().start()

        selectBundlerConfigFile(bundler, generatedBoilerplateDir, spinner)
        selectPaymasterConfigFile(paymaster, generatedBoilerplateDir, spinner)
        selectSignerConfigFile(signer, generatedBoilerplateDir, spinner)
        selectAppFile(signer, generatedBoilerplateDir, spinner)
        selectComponentFile(signer, generatedBoilerplateDir, spinner)
        selectIndexFile(signer, generatedBoilerplateDir, spinner)
        selectSignerHooks(
            signer,
            accountSystem,
            generatedBoilerplateDir,
            spinner
        )
    } catch (error) {
        console.error("Boilerplate generation failed:", error.message)
    }
}
