import type { UserOperation } from "./userOperation.js"

export type { UserOperation }

export type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
