import figlet from "figlet"
import gradient from "gradient-string"

import { CREATE_PERMISSIONLESS_APP } from "../constants"

const poimandresTheme = {
    blue: "#add7ff",
    cyan: "#89ddff",
    green: "#5de4c7",
    magenta: "#fae4fc",
    red: "#d0679d",
    yellow: "#fffac2"
}

export const renderTitle = async () => {
    const t3Gradient = await gradient(Object.values(poimandresTheme))
    await figlet(CREATE_PERMISSIONLESS_APP, (err, data: string) => {
        console.log(t3Gradient(`${data}\n`))
    })
}
