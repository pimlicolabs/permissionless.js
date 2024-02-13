import path from "path"
import { fileURLToPath } from "url"
import fs from "fs-extra"

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
        // Check if the index.ts file exists
        if (fs.existsSync(indexPath)) {
            // Read the existing index.ts file
            let indexContent = fs.readFileSync(indexPath, "utf-8")

            // Check if the module is already imported
            if (
                !indexContent.includes(
                    `import { ${moduleName} } from "./${moduleName}";`
                )
            ) {
                // Append import statement to index.ts
                indexContent += `\nimport { ${moduleName} } from "./${moduleName}";`

                // Update the export line to include the new module
                indexContent = indexContent.replace(
                    /(export\s*{)([^}]+)(})/,
                    `$1$2, ${moduleName}$3`
                )

                // Write back the updated index.ts file
                fs.writeFileSync(indexPath, indexContent)
            }
        } else {
            let indexContent = ""
            indexContent += `\nimport { ${moduleName} } from "./${moduleName}";`
            indexContent += `\nexport { ${moduleName} };`

            fs.writeFileSync(indexPath, indexContent)
        }
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
    generatedBoilerplateDir: string
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

            console.log(`Bundler files copied successfully: ${bundler}`)
        } else {
            console.error(`Bundler files not found for: ${bundler}`)
        }
    } catch (error) {
        console.error(`Error selecting bundler files: ${error.message}`)
    }
}

// Select paymaster-specific files
const selectPaymasterConfigFile = (
    paymaster: string,
    generatedBoilerplateDir: string
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

            console.log(
                `Paymaster config file copied successfully: ${paymaster}`
            )
        } else {
            console.error(`Paymaster config file not found for: ${paymaster}`)
        }
    } catch (error) {
        console.error(`Error selecting bundler file: ${error.message}`)
    }
}

// Select signer-specific files
const selectSignerConfigFile = (
    signer: string,
    generatedBoilerplateDir: string
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

            console.log(`Signer config file copied successfully: ${signer}`)
        } else {
            console.error(`Signer config file not found for: ${signer}`)
        }
    } catch (error) {
        console.error(`Error selecting signer config file: ${error.message}`)
    }
}

// Select _app.tsx content
const selectAppFile = (signer: string, generatedBoilerplateDir: string) => {
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

            console.log(`App file overwritten successfully: ${signer}`)
        } else {
            console.error(`App file not found for: ${signer}`)
        }
    } catch (error) {
        console.error(`Error selecting App file: ${error.message}`)
    }
}

const selectComponentFile = (
    signer: string,
    generatedBoilerplateDir: string
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

            console.log("Component files copied successfully")
        } else {
            console.error(`Component file not found for: ${signer}`)
        }
    } catch (error) {
        console.error(`Error selecting Component Component: ${error.message}`)
    }
}

// Select index.tsx content
const selectIndexFile = (signer: string, generatedBoilerplateDir: string) => {
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

            console.log(`Index file overwritten successfully: ${signer}`)
        } else {
            console.error(`Index file not found for: ${signer}`)
        }
    } catch (error) {
        console.error(`Error selecting Index file: ${error.message}`)
    }
}

// Select signer-specific hooks
const selectSignerHooks = (
    signer: string,
    accountSystem: string,
    generatedBoilerplateDir: string
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

                console.log(
                    `Hook file with account option  ${accountSystem} overwritten successfully`
                )
            } else {
                console.error(`Hook file not found for:  ${accountSystem} `)
            }
        }
    } catch (error) {
        console.error(`Failed to select signer hooks: ${error.message}`)
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
        const generatedBoilerplateDir = path.resolve(process.cwd(), projectDir)

        // selectCommonBase(generatedBoilerplateDir);
        selectBundlerConfigFile(bundler, generatedBoilerplateDir)
        selectPaymasterConfigFile(paymaster, generatedBoilerplateDir)
        selectSignerConfigFile(signer, generatedBoilerplateDir)
        selectAppFile(signer, generatedBoilerplateDir)
        selectComponentFile(signer, generatedBoilerplateDir)
        selectIndexFile(signer, generatedBoilerplateDir)
        selectSignerHooks(signer, accountSystem, generatedBoilerplateDir)

        console.log("Boilerplate selection successful!")
    } catch (error) {
        console.error("Boilerplate selection failed:", error.message)
    }
}
