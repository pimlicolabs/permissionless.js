import { Actions, type Client } from "viem"

export const getAction = <options, returnType>(
    client: { request: unknown },
    // biome-ignore lint/suspicious/noExplicitAny: keeps the client position of generic actions out of inference, as viem does
    fn: (client: any, options: options) => returnType,
    path: string
): ((options: options) => returnType) =>
    Actions.getAction(client as unknown as Client.Client, fn, path)
