---
"@stripe/bun-toolkit": patch
---

Default NODE_AUTH_TOKEN to empty before running build scripts so yarn doesn't fail on unresolved .npmrc variables during local builds.
