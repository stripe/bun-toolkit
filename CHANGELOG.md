# @stripe/bun-toolkit

## 0.4.2

### Patch Changes

- [#13](https://github.com/stripe/bun-toolkit/pull/13) [`07f64ae`](https://github.com/stripe/bun-toolkit/commit/07f64ae81fcf3e344903fbb5257f80f336b319a6) Thanks [@jar-stripe](https://github.com/jar-stripe)! - Switch publishing from GitHub Packages to npm.

## 0.4.1

### Patch Changes

- [#11](https://github.com/stripe/bun-toolkit/pull/11) [`7cb08c8`](https://github.com/stripe/bun-toolkit/commit/7cb08c8b010488ed5089d57f98576155670c12ca) Thanks [@jar-stripe](https://github.com/jar-stripe)! - Add internal-use notice to README.

## 0.4.0

### Minor Changes

- [#8](https://github.com/stripe/bun-toolkit/pull/8) [`8df36e7`](https://github.com/stripe/bun-toolkit/commit/8df36e7b701a9e4fb7c800579ed4d26a61e24a05) Thanks [@jar-stripe](https://github.com/jar-stripe)! - Add `bun.assetRoot` config and fix compiled binary argv[0]
  - **`bun.assetRoot`**: New optional field in package.json's `bun` config. When set, asset glob patterns are resolved relative to `assetRoot` instead of cwd, and manifest keys are relative to `assetRoot`. This allows packages nested in a monorepo to embed assets from a parent directory while keeping stable manifest keys that match what the consuming code expects.
  - **argv fix**: Bun compiled binaries set `process.argv[0]` to the literal string `"bun"`, which causes CLI frameworks like yargs to display "bun" as the program name in help output. The generated entrypoint now rewrites `argv[0]` to the basename of `argv[1]` (the actual binary path) before the consumer's code runs.

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
