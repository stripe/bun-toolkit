# @stripe/bun-toolkit

Shared Bun binary infrastructure: asset embedding, manifest generation, and cross-compilation.

## What this provides

1. **Runtime module** (`@stripe/bun-toolkit/runtime`) — `getAssetDir()` / `resolveAsset()` for transparent asset access in both dev and compiled binary modes
2. **Manifest generator** (`bun-generate-manifest`) — reads `bun.assets` globs from package.json, generates a Bun compile entrypoint that embeds all assets
3. **Binary builder** (`bun-build-binaries`) — full cross-compilation pipeline with version validation and target mapping

## Usage

### 1. Configure assets in package.json

```json
{
  "bun": {
    "assets": ["openapi/*.yaml", "assets/**"],
    "entry": "./dist/main.js"
  }
}
```

### 2. Use the runtime in your code

```ts
import { resolveAsset } from '@stripe/bun-toolkit/runtime';

const specPath = resolveAsset('openapi/spec.yaml');
```

### 3. Build binaries

```bash
npx bun-build-binaries ./bin "macos-arm64,linux-x64"
```

## How it works

**Build time**: `bun-generate-manifest` expands the asset globs and writes `dist/bun-compile-entrypoint.js` with `import ... with { type: "file" }` statements. This tells Bun to embed each file directly in the binary.

**Binary mode**: When the binary runs, `globalThis.__EMBEDDED_ASSET_MANIFEST__` maps logical paths to Bun's virtual filesystem paths. `getAssetDir()` extracts all embedded files to a temp directory on first call. The temp directory is cleaned up on process exit.

**Dev mode**: When running via Node/tsx/bun without compilation, `getAssetDir()` returns the repo root where assets exist on disk. No extraction needed.

## Scripts

- `pnpm build` — compile TypeScript
- `pnpm test` — run unit tests
- `./scripts/smoke-test.sh` — end-to-end test: builds a fixture into a binary and verifies embedded assets work from a foreign cwd
