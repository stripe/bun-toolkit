---
"@stripe/bun-toolkit": minor
---

Initial release of @stripe/bun-toolkit, ported from stripe-cli-ts-plugin-bootstrap's embedded asset infrastructure.

Provides shared Bun binary compilation support:
- Runtime API (`getAssetDir`, `isEmbedded`, `resolveAsset`) for accessing embedded assets
- `bun-generate-manifest` script for generating embedded asset entrypoints from `bun.assets` globs
- `bun-build-binaries` script for cross-platform binary compilation
- Smoke test fixture for end-to-end verification
