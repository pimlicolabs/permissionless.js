#!/usr/bin/env node
import path from "path"
import { execa } from "execa"
import fs from "fs-extra"
import { type PackageJson } from "type-fest"

import { runCli } from "./cli/index"
import { createProject } from "./helpers/createProject"

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
        flags: { bundler, paymaster, signer, accountSystem }
    } = await runCli()

    // e.g. dir/@mono/app returns ["@mono/app", "dir/app"]
    const [scopedAppName, appDir] = parseNameAndPath(appName)

    const projectDir = await createProject({
        projectName: appDir,
        bundler,
        paymaster,
        signer,
        accountSystem
    })

    console.log("projectDir:", projectDir)

    // Write name to package.json
    const pkgJson = fs.readJSONSync(
        path.join(projectDir, "package.json")
    ) as CPAPackageJSON
    pkgJson.name = scopedAppName

    fs.writeJSONSync(path.join(projectDir, "package.json"), pkgJson, {
        spaces: 2
    })

    process.exit(0)
}

main().catch((err) => {
    logger.error("Aborting installation...")
    if (err instanceof Error) {
        logger.error(err)
    } else {
        logger.error(
            "An unknown error has occurred. Please open an issue on github with the below:"
        )
        console.log(err)
    }
    process.exit(1)
})
