# @stripe/bun-toolkit

## 0.2.0

### Minor Changes

- [`b7ddafd`](https://github.com/stripe/bun-toolkit/commit/b7ddafda1fe524685d662ea97670ec68bd925ac4) Thanks [@jar-stripe](https://github.com/jar-stripe)! - Initial release of @stripe/bun-toolkit, ported from stripe-cli-ts-plugin-bootstrap's embedded asset infrastructure.

  Provides shared Bun binary compilation support:
  - Runtime API (`getAssetDir`, `isEmbedded`, `resolveAsset`) for accessing embedded assets
  - `bun-generate-manifest` script for generating embedded asset entrypoints from `bun.assets` globs
  - `bun-build-binaries` script for cross-platform binary compilation
  - Smoke test fixture for end-to-end verification
