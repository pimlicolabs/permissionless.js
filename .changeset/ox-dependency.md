---
"permissionless": minor
---

`ox` is now a regular dependency (`^1.8.8`) instead of an optional peer dependency, fixing npm ERESOLVE / invalid peer errors when installed alongside viem versions that ship a different `ox`.

Breaking: `getOxExports` and `hasOxModule` were removed from `permissionless/utils`. Import from `ox` directly instead.
