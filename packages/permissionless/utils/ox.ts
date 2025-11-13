/**
 * Utility module for handling optional ox imports
 * This allows the library to work without ox being installed
 */

let oxModule: any = null

// Try to load ox module
try {
    // Use dynamic import for ESM compatibility
    const importPromise = import("ox")
    // Note: This will be handled in the functions that need ox
    oxModule = { importPromise }
} catch (error) {
    // ox is not installed, this is fine for optional dependency
}

export async function getOxModule() {
    if (!oxModule) {
        throw new Error(
            "The 'ox' package is required for WebAuthn functionality. Please install it: npm install ox"
        )
    }

    try {
        return await oxModule.importPromise
    } catch (error) {
        throw new Error(
            "The 'ox' package is required for WebAuthn functionality. Please install it: npm install ox"
        )
    }
}

export function hasOxModule(): boolean {
    return oxModule !== null
}

// Helper function to get ox exports
export async function getOxExports() {
    const ox = await getOxModule()
    return {
        Base64: ox.Base64,
        Hex: ox.Hex,
        PublicKey: ox.PublicKey,
        Signature: ox.Signature,
        WebAuthnP256: ox.WebAuthnP256
    }
}
