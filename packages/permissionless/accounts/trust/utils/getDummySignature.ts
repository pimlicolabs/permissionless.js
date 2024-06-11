import type { Hex } from "viem"
import type {
    EntryPoint,
    GetEntryPointVersion,
    UserOperation
} from "../../../types"

export const getDummySignature = async <entryPoint extends EntryPoint>(
    _userOperation: UserOperation<GetEntryPointVersion<entryPoint>>
) => {
    return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c" as Hex
}
