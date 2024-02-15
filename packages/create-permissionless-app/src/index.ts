#!/usr/bin/env node
import path from "path"
import fs from "fs-extra"
import { type PackageJson } from "type-fest"

import { runCli } from "./cli/index"
import { createProject } from "./helpers/createProject"
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
    renderTitle()

    const {
        appName,
        flags: { noInstall, bundler, paymaster, signer, accountSystem }
    } = await runCli()
    const packageManager: PackageManager = detectPackageManager()

    const [scopedAppName, appDir] = parseNameAndPath(appName)

    const projectDir = await createProject({
        projectName: appDir,
        bundler,
        paymaster,
        signer,
        accountSystem
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

    // Display next steps for the user
    logger.info("Next steps:")
    scopedAppName !== "." && logger.info(`  cd ${scopedAppName}`)
    if (noInstall) {
        // To reflect yarn's default behavior of installing packages when no additional args provided
        if (packageManager === "yarn") {
            logger.info(`  ${packageManager}`)
        } else {
            logger.info(`  ${packageManager} install`)
        }
    }

    // Thank you note and apology for beta issues
    logger.info("\nThank you for using our CLI tool!")
    logger.info(
        "As we launch the first version, please pardon any issues during beta testing."
    )
    logger.info(
        "Your feedback helps us improve. If you encounter any bugs or have suggestions, please let us know."
    )
    logger.info("We appreciate your support!")

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
