import type { SerializeTransactionFn, TransactionSerializable } from "viem"
import { SignTransactionNotSupportedBySmartAccount } from "../../types"

export const signTransaction = <
    serializer extends
        SerializeTransactionFn<TransactionSerializable> = SerializeTransactionFn<TransactionSerializable>,
    transaction extends Parameters<serializer>[0] = Parameters<serializer>[0]
>(
    _transaction: transaction,
    _args?: {
        serializer?: serializer
    }
) => {
    throw new SignTransactionNotSupportedBySmartAccount()
}
