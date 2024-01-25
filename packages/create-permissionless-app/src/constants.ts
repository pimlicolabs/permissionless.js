import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const distPath = path.dirname(__filename)
export const PKG_ROOT = path.join(distPath, "../")

export const TITLE_TEXT = `  _______  ____ ___ ______ ____   ____  ________ ___  _____ __  __ __  ___  __  ____    ____ __  __     ___ ____ ____ 
//  || \\||   // \\| || |||      || \\||   || \\||\\//||||(( \(( \|| // \\ ||\ ||||   ||   (( \(( \   // \\|| \\|| \\
((   ||_//||== ||=||  ||  ||==    ||_//||== ||_//|| \/ |||| \\  \\ ||((   ))||\\||||   ||==  \\  \\    ||=||||_//||_//
\\__|| \\||___|| ||  ||  ||___   ||   ||___|| \\||    ||||\_))\_))|| \\_// || \||||__|||___\_))\_))   || ||||   ||
`

export const DEFAULT_APP_NAME = "my-permissionless-app"
export const CREATE_PERMISSIONLESS_APP = "create-permissionless-app"
