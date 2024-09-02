export const DUMMY_ECDSA_SIGNATURE =
    "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
export const ROOT_MODE_KERNEL_V2 = "0x00000000"

export const VALIDATOR_TYPE = {
    ROOT: "0x00",
    VALIDATOR: "0x01",
    PERMISSION: "0x02"
} as const
export enum VALIDATOR_MODE {
    DEFAULT = "0x00",
    ENABLE = "0x01"
}
