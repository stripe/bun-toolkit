# @stripe/bun-toolkit

## 0.3.0

### Minor Changes

- [#4](https://github.com/stripe/bun-toolkit/pull/4) [`1dd00bb`](https://github.com/stripe/bun-toolkit/commit/1dd00bb0e608213c380fa884e24d26975fe57b54) Thanks [@jar-stripe](https://github.com/jar-stripe)! - Make the pre-compilation build script configurable via `bun.buildScript` in package.json. Defaults to `"prebuild-binary"`. If the script doesn't exist, the build step is skipped. This avoids hijacking the conventional `build` script name.

## 0.2.0

### Minor Changes

- [`c72181b`](https://github.com/stripe/bun-toolkit/commit/c72181b6b563e87b2479721a8467bfe225a751a4) Thanks [@jar-stripe](https://github.com/jar-stripe)! - Initial release of @stripe/bun-toolkit, ported from stripe-cli-ts-plugin-bootstrap's embedded asset infrastructure.

  Provides shared Bun binary compilation support:
  - Runtime API (`getAssetDir`, `isEmbedded`, `resolveAsset`) for accessing embedded assets
  - `bun-generate-manifest` script for generating embedded asset entrypoints from `bun.assets` globs
  - `bun-build-binaries` script for cross-platform binary compilation
  - Smoke test fixture for end-to-end verification
