// Imports every exported subpath of the permissionless package so that tsc
// resolves each one. If raw .ts sources ever leak back into consumer programs
// (missing subpath proxy package.json, see issue #522) or the published .d.ts
// surface breaks under strict flags, these imports fail to type-check.
export * as permissionless from "permissionless"
export * as accounts from "permissionless/accounts"
export * as actions from "permissionless/actions"
export * as actionsErc7579 from "permissionless/actions/erc7579"
export * as actionsEtherspot from "permissionless/actions/etherspot"
export * as actionsPasskeyServer from "permissionless/actions/passkeyServer"
export * as actionsPimlico from "permissionless/actions/pimlico"
export * as actionsSmartAccount from "permissionless/actions/smartAccount"
export * as clients from "permissionless/clients"
export * as clientsPasskeyServer from "permissionless/clients/passkeyServer"
export * as clientsPimlico from "permissionless/clients/pimlico"
export * as errors from "permissionless/errors"
export * as experimentalPimlico from "permissionless/experimental/pimlico"
export * as utils from "permissionless/utils"
