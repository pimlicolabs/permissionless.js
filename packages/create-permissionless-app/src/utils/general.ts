export const removeTrailingSlash = (input: string) => {
    let result = input

    if (input.length > 1 && input.endsWith("/")) {
        result = input.slice(0, -1)
    }

    return result
}
