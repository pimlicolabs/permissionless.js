export type PackageManager = "npm" | "yarn" | "pnpm" | "bun"

export const detectPackageManager: () => PackageManager = () => {
    // Yarn sets the YARN_VERSION environment variable to indicate its usage
    if (process.env.YARN_VERSION) {
        return "yarn"
    }

    // pnpm sets the pnpm_config_user_agent environment variable to indicate its usage
    if (process.env.pnpm_config_user_agent) {
        return "pnpm"
    }

    // Bun sets the BUN_VERSION environment variable to indicate its usage
    if (process.env.BUN_VERSION) {
        return "bun"
    }

    // Check npm_config_user_agent for npm
    const userAgent = process.env.npm_config_user_agent
    if (userAgent) {
        if (userAgent.startsWith("yarn")) {
            return "yarn"
        }
        if (userAgent.startsWith("pnpm")) {
            return "pnpm"
        }
        if (userAgent.startsWith("bun")) {
            return "bun"
        }
    }

    // Default to npm if none of the known indicators are found
    return "npm"
}
