import type { Address } from "viem/utils"

/**
 * Sorts addresses in ascending byte-wise (code unit) order, independent of
 * the host's locale. Using String.prototype.localeCompare without an explicit
 * locale makes the order depend on the ICU default locale (e.g. under
 * da_DK the "aa" digraph sorts after "z"), which would make CREATE2
 * counterfactual address derivation non-deterministic across hosts.
 */
export const sortAddresses = (
    addresses: Address.Address[]
): Address.Address[] =>
    [...addresses].sort((left, right) => {
        const leftAddress = left.toLowerCase()
        const rightAddress = right.toLowerCase()
        if (leftAddress < rightAddress) {
            return -1
        }
        if (leftAddress > rightAddress) {
            return 1
        }
        return 0
    })
