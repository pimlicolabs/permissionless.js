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

// Use import.meta.url to get the current module file path
const __filename = fileURLToPath(import.meta.url)
// Use path.dirname to get the currrent directory path
const moduleDir = path.dirname(__filename)

const templateExtrasDir = path.resolve(moduleDir, "../../template/extras")

// Select base files
// const selectCommonBase = (generatedBoilerplateDir: string) => {
//   const templateExtrasDir = path.resolve(
//     generatedBoilerplateDir,
//     "../template/extras"
//   );

//   console.log("templateExtrasDir:", templateExtrasDir);
//   copyFiles(path.join(templateExtrasDir, "base"), generatedBoilerplateDir);
// };

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
            "bundlerConfig.ts"
        )

        // Check if the source path exists before copying
        if (fs.existsSync(sourcePath)) {
            // Ensure the destination directory exists before copying
            fs.ensureDirSync(path.dirname(destinationPath))

            copyFiles(sourcePath, destinationPath)

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
            "paymasterConfig.ts"
        )

        // Check if the source path exists before copying
        if (fs.existsSync(sourcePath)) {
            // Ensure the destination directory exists before copying
            fs.ensureDirSync(path.dirname(destinationPath))

            copyFiles(sourcePath, destinationPath)

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
            "signerConfig.ts"
        )

        // Check if the source path exists before copying
        if (fs.existsSync(sourcePath)) {
            // Ensure the destination directory exists before copying
            fs.ensureDirSync(path.dirname(destinationPath))

            copyFiles(sourcePath, destinationPath)

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

            if (fs.existsSync(sourceHookFile)) {
                // Ensure the destination directory exists before copying
                fs.ensureDirSync(path.dirname(destinationHookFile))

                overwriteFileContent(sourceHookFile, destinationHookFile)

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
        selectIndexFile(signer, generatedBoilerplateDir)
        selectSignerHooks(signer, accountSystem, generatedBoilerplateDir)

        console.log("Boilerplate selection successful!")
    } catch (error) {
        console.error("Boilerplate selection failed:", error.message)
    }
}
