// Imports every exported subpath of the permissionless package so that tsc
// resolves each one. If raw .ts sources ever leak back into consumer programs
// (issue #522) or the published .d.ts surface breaks under strict flags, these
// imports fail to type-check.
export * as permissionless from "permissionless"
export * as etherspot from "permissionless/etherspot"
export * as experimental from "permissionless/experimental"
export * as pimlico from "permissionless/pimlico"
