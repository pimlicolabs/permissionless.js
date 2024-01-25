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

// // Use import.meta.url to get the current module file path
// const __filename = fileURLToPath(import.meta.url);
// // Use path.dirname to get the directory path
// const moduleDir = path.dirname(__filename);

// Select common/base files
const selectCommonBase = (generatedBoilerplateDir: string) => {
    const templateExtrasDir = path.resolve(
        generatedBoilerplateDir,
        "../template/extras"
    )

    console.log("templateExtrasDir:", templateExtrasDir)
    copyFiles(path.join(templateExtrasDir, "base"), generatedBoilerplateDir)
}

// Select bundler-specific files
const selectBundlerFiles = (
    bundler: string,
    generatedBoilerplateDir: string
) => {
    const templateExtrasDir = path.resolve(
        generatedBoilerplateDir,
        "../template/extras"
    )
    copyFiles(
        path.join(templateExtrasDir, "bundler", bundler),
        path.join(generatedBoilerplateDir, "src", "config", "bundlerConfig.ts")
    )
}

// Select paymaster-specific files
const selectPaymasterFiles = (
    paymaster: string,
    generatedBoilerplateDir: string
) => {
    const templateExtrasDir = path.resolve(
        generatedBoilerplateDir,
        "../template/extras"
    )
    copyFiles(
        path.join(templateExtrasDir, "paymaster", paymaster),
        path.join(
            generatedBoilerplateDir,
            "src",
            "config",
            "paymasterConfig.ts"
        )
    )
}

// Select signer-specific files
const selectSignerFiles = (signer: string, generatedBoilerplateDir: string) => {
    const templateExtrasDir = path.resolve(
        generatedBoilerplateDir,
        "../template/extras"
    )
    copyFiles(
        path.join(templateExtrasDir, "signer", signer),
        path.join(generatedBoilerplateDir, "src", "config", "signerConfig.ts")
    )
}

// Select _app.tsx content
const selectAppFile = (signer: string, generatedBoilerplateDir: string) => {
    const templateExtrasDir = path.resolve(
        generatedBoilerplateDir,
        "../template/extras"
    )
    overwriteFileContent(
        path.join(templateExtrasDir, "pages", "_app", `with-${signer}.tsx`),
        path.join(generatedBoilerplateDir, "src", "pages", "_app.tsx")
    )
}

// Select index.tsx content
const selectIndexFile = (signer: string, generatedBoilerplateDir: string) => {
    const templateExtrasDir = path.resolve(
        generatedBoilerplateDir,
        "../template/extras"
    )
    overwriteFileContent(
        path.join(templateExtrasDir, "pages", "index", `with-${signer}.tsx`),
        path.join(generatedBoilerplateDir, "src", "pages", "index.tsx")
    )
}

// Select signer-specific hooks
const selectSignerHooks = (
    signer: string,
    accountOption: string,
    generatedBoilerplateDir: string
) => {
    if (signer === "privy") {
        const templateExtrasDir = path.resolve(
            generatedBoilerplateDir,
            "../template/extras"
        )
        const sourceHookFile = path.join(
            templateExtrasDir,
            "signer",
            signer,
            "hooks",
            `usePrivyAuthWith${accountOption}.ts`
        )
        const destinationHookFile = path.join(
            generatedBoilerplateDir,
            "src",
            "hooks",
            "usePrivyAuth.ts"
        )
        overwriteFileContent(sourceHookFile, destinationHookFile)
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
        console.log("generatedBoilerplateDir:", generatedBoilerplateDir)

        selectCommonBase(generatedBoilerplateDir)
        selectBundlerFiles(bundler, generatedBoilerplateDir)
        selectPaymasterFiles(paymaster, generatedBoilerplateDir)
        selectSignerFiles(signer, generatedBoilerplateDir)
        selectAppFile(signer, generatedBoilerplateDir)
        selectIndexFile(signer, generatedBoilerplateDir)
        selectSignerHooks(signer, accountSystem, generatedBoilerplateDir)

        console.log("Boilerplate selection successful!")
    } catch (error) {
        console.error("Boilerplate selection failed:", error.message)
        // You may choose to throw the error or handle it as appropriate for your application.
    }
}
