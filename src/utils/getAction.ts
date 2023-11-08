import type { Client } from "viem"

export function getAction<params extends {}, returnType extends {}>(
    client: Client,
    // biome-ignore lint/suspicious/noExplicitAny: it's a recursive function, so it's hard to type
    action: (_: any, params: params) => returnType,
    actionName: string = action.name
) {
    return (params: params): returnType =>
        (
            client as Client & {
                [key: string]: (params: params) => returnType
            }
        )[actionName]?.(params) ?? action(client, params)
}
