import path from "path"
import fs from "fs-extra"

export const addPackageDependency = (signer: string, baseDir: string) => {
    // const { signer } = options;
    const packageJsonPath = path.join(baseDir, "package.json")

    try {
        // Read the existing package.json
        const packageJson = fs.readJsonSync(packageJsonPath)

        // Update dependencies based on selected options
        const dependencies: Record<string, string> =
            packageJson.dependencies || {}

        // Add packages based on signer option
        if (signer === "privy") {
            dependencies["@privy-io/react-auth"] = "^1.59.5"
            dependencies["@privy-io/wagmi"] = "^0.2.1"
        }

        // Write back the updated package.json
        packageJson.dependencies = dependencies
        fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })
    } catch (error) {
        console.error("Failed to update package.json:", error.message)
    }
}
