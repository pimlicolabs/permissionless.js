---
"permissionless": patch
---

Add React Native support via `react-native` export conditions in package.json

This addresses the module resolution issues in React Native/Metro bundler environments (fixes #61). The `react-native` condition is explicitly supported by Metro and takes precedence when resolving modules in React Native projects.
