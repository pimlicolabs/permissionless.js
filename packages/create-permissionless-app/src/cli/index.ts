import * as p from "@clack/prompts"
import { Command } from "commander"

import { CREATE_PERMISSIONLESS_APP, DEFAULT_APP_NAME } from "../constants"
import {
    type PackageManager,
    detectPackageManager
} from "../utils/detectPackageManager"
import { logger } from "../utils/logger"
import { validateAppName } from "../utils/validateAppName"

interface CliFlags {
    noInstall: boolean
    default: boolean

    bundler: string
    paymaster: string
    signer: string
    accountSystem: string

    pimlicoApiKey: string
    privyAppId: string
    publicRPCUrl: string
}

interface CliResults {
    appName: string
    flags: CliFlags
}

const defaultOptions: CliResults = {
    appName: DEFAULT_APP_NAME,
    flags: {
        noInstall: false,
        default: false,
        bundler: "pimlico",
        paymaster: "pimlico",
        signer: "privy",
        accountSystem: "safe",
        pimlicoApiKey: "",
        privyAppId: "",
        publicRPCUrl: ""
    }
}

export const runCli = async (): Promise<CliResults> => {
    const cliResults = defaultOptions

    const program = new Command()
        .name(CREATE_PERMISSIONLESS_APP)
        .description("A CLI to spin up a permissionless app with Pimlico")
        .argument(
            "[dir]",
            "The name of the application, as well as the name of the directory to create"
        )
        .option(
            "--noInstall",
            "Explicitly tell the CLI to not run the package manager's install command",
            false
        )
        .option(
            "-y, --default",
            "Bypass the CLI and use all default options to bootstrap a new permissionless app",
            false
        )

        /** START CI-FLAGS
         * As of now these CI Flags are not well structured but will be updated soon..
         */
        .option(
            "-b, --bundler",
            "Specify the bundler provider",
            defaultOptions.flags.bundler
        )
        .option(
            "-p, --paymaster",
            "Specify the paymaster provider",
            defaultOptions.flags.paymaster
        )
        .option(
            "-s, --signer",
            "Specify the signer",
            defaultOptions.flags.signer
        )
        .option(
            "-a, --account-system",
            "Specify the account system",
            defaultOptions.flags.accountSystem
        )
        /** END CI-FLAGS */
        .parse(process.argv)

    const cliProvidedName = program.args[0]
    if (cliProvidedName) {
        cliResults.appName = cliProvidedName
    }

    cliResults.flags = program.opts()

    try {
        const packageManager: PackageManager = detectPackageManager()
        const project = await p.group(
            {
                ...(!cliProvidedName && {
                    name: () =>
                        p.text({
                            message: "What will your project be called?",
                            defaultValue: cliProvidedName,
                            validate: validateAppName
                        })
                }),
                bundler: () => {
                    return p.select({
                        message: "Pick your bundler provider",
                        options: [{ value: "pimlico", label: "Pimlico" }],
                        initialValue: cliResults.flags.bundler
                    })
                },
                paymaster: () => {
                    return p.select({
                        message: "Pick your paymaster provider",
                        options: [{ value: "pimlico", label: "Pimlico" }],
                        initialValue: cliResults.flags.paymaster
                    })
                },

                ...(cliResults.flags.bundler === "pimlico" ||
                cliResults.flags.paymaster === "pimlico"
                    ? {
                          pimlicoApiKey: () => {
                              return p.text({
                                  message:
                                      "Please provide the Pimlico API key for your project configuration",
                                  defaultValue: cliResults.flags.pimlicoApiKey
                              })
                          }
                      }
                    : {}),
                accountSystem: () => {
                    return p.select({
                        message: "Pick your account system",
                        options: [{ value: "safe", label: "Safe" }],
                        initialValue: cliResults.flags.accountSystem
                    })
                },
                signer: () => {
                    return p.select({
                        message: "Pick your signer",
                        options: [{ value: "privy", label: "Privy" }],
                        initialValue: cliResults.flags.signer
                    })
                },
                ...(cliResults.flags.signer === "privy"
                    ? {
                          privyAppId: () => {
                              return p.text({
                                  message:
                                      "Please provide the Privy API ID for your project configuration",
                                  defaultValue: cliResults.flags.publicRPCUrl
                              })
                          }
                      }
                    : {}),
                publicRPCUrl: () => {
                    return p.text({
                        message:
                            "Please provide the sepolia testnet rpc url for your project configuration",
                        defaultValue: cliResults.flags.publicRPCUrl
                    })
                },
                ...(!cliResults.flags.noInstall && {
                    install: () => {
                        return p.confirm({
                            message: `Should we run '${packageManager}${
                                packageManager === "yarn"
                                    ? `'?`
                                    : ` install' for you?`
                            }`,
                            initialValue: !defaultOptions.flags.noInstall
                        })
                    }
                })
            },
            {
                onCancel() {
                    process.exit(1)
                }
            }
        )

        return {
            appName: project.name ?? cliResults.appName,
            flags: {
                ...cliResults.flags,
                noInstall: !project.install || cliResults.flags.noInstall,
                signer: project.signer ?? cliResults.flags.signer,
                paymaster: project.paymaster ?? cliResults.flags.paymaster,
                bundler: project.bundler ?? cliResults.flags.bundler,
                accountSystem:
                    project.accountSystem ?? cliResults.flags.accountSystem,
                privyAppId: project.privyAppId ?? cliResults.flags.privyAppId,
                pimlicoApiKey:
                    project.pimlicoApiKey ?? cliResults.flags.pimlicoApiKey,
                publicRPCUrl:
                    project.publicRPCUrl ?? cliResults.flags.publicRPCUrl
            }
        }
    } catch (err) {
        const shouldContinue = await p.confirm({
            message: "Continue scaffolding a default Permissionless app?",
            initialValue: true
        })

        if (!shouldContinue) {
            logger.info("Exiting...")
            process.exit(0)
        }

        logger.info(
            `Bootstrapping a default Permissionless app in ./${cliResults.appName}`
        )
    }

    return cliResults
}
