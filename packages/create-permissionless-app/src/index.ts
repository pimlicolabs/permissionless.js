#!/usr/bin/env node
import path from "path"
import fs from "fs-extra"
import { type PackageJson } from "type-fest"

import { runCli } from "./cli/index"
import { createProject } from "./helpers/createProject"
import { initializeGit } from "./helpers/git"
import { installDependencies } from "./helpers/installDependencies"
import { addPackageDependency } from "./utils/addPackageDependency"
import {
    type PackageManager,
    detectPackageManager
} from "./utils/detectPackageManager"
import { logger } from "./utils/logger"
import { parseNameAndPath } from "./utils/parseNameAndPath"
import { renderTitle } from "./utils/renderTitle"

type CPAPackageJSON = PackageJson & {
    cpaMetadata?: {
        initVersion: string
    }
}

const main = async () => {
    await renderTitle()

    const {
        appName,
        flags: {
            noGit,
            noInstall,
            bundler,
            paymaster,
            signer,
            accountSystem,
            privyAppId,
            pimlicoApiKey,
            publicRPCUrl
        }
    } = await runCli()
    const packageManager: PackageManager = detectPackageManager()

    const [scopedAppName, appDir] = parseNameAndPath(appName)

    const projectDir = await createProject({
        projectName: appDir,
        bundler,
        paymaster,
        signer,
        accountSystem,
        privyAppId,
        pimlicoApiKey,
        publicRPCUrl
    })

    // Write name to package.json
    const pkgJson = fs.readJSONSync(
        path.join(projectDir, "package.json")
    ) as CPAPackageJSON
    pkgJson.name = scopedAppName

    fs.writeJSONSync(path.join(projectDir, "package.json"), pkgJson, {
        spaces: 2
    })

    addPackageDependency(signer, projectDir)

    if (!noInstall) {
        await installDependencies(projectDir)
    }

    if (!noGit) {
        await initializeGit(projectDir)
    }

    // Display next steps for the user
    logger.info("\n Next steps:")
    scopedAppName !== "." && logger.info(`  - cd ${scopedAppName}`)
    if (noInstall) {
        // To reflect yarn's default behavior of installing packages when no additional args provided
        if (packageManager === "yarn") {
            logger.info(`  - ${packageManager}`)
        } else {
            logger.info(`  - ${packageManager} install`)
        }
    }

    logger.info(
        "  - create a .env file in the root dir based on the .env.example template and provide the necessary values"
    )

    if (packageManager === "yarn") {
        logger.info(`  - ${packageManager} dev`)
    } else {
        logger.info(`  - ${packageManager} run dev`)
    }

    // Thank you note and apology for beta issues
    logger.info("\nThank you for using our CLI tool!")
    logger.info(
        "If you encounter any issues, please let us know in our Telegram channel. Your feedback helps us improve."
    )
    logger.info(
        "We apologize for any inconvenience during beta testing. Thanks for being patient!"
    )

    // Telegram invitation link
    logger.info("\nJoin our Telegram group for support and updates:")
    logger.info("https://t.me/pimlicoHQ")

    process.exit(0)
}

main().catch((err) => {
    logger.error("Aborting installation...")
    if (err instanceof Error) {
        logger.error(err)
    } else {
        logger.error("An unknown error has occurred!")
    }
    process.exit(1)
})
