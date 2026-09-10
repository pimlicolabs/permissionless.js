export function toBytes(value: string): Uint8Array {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
}

export function fromBytes(
    value: Uint8Array,
    { pad = true, url = false }: { pad?: boolean; url?: boolean } = {}
): string {
    let binary = ""
    for (const byte of value) binary += String.fromCharCode(byte)
    let base64 = btoa(binary)
    if (url) base64 = base64.replace(/\+/g, "-").replace(/\//g, "_")
    if (!pad) base64 = base64.replace(/=+$/, "")
    return base64
}
