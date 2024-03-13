import fs from "fs"
import path from "path"

export const createEnv = (projectDir: string, key: string, value: string) => {
    const envFilePath = path.join(projectDir, ".env")
    let envContent = ""

    try {
        // Read existing env file if it exists
        if (fs.existsSync(envFilePath)) {
            envContent = fs.readFileSync(envFilePath, "utf-8")
        }

        // Add or update the environment variable
        const updatedEnv = `${envContent}\nNEXT_PUBLIC_${key}=${value}`

        // Write the updated content back to the .env file
        fs.writeFileSync(envFilePath, updatedEnv)
    } catch (error) {
        console.error(`Error creating .env file: ${error}`)
    }
}
