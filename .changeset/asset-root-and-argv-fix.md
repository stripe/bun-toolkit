---
"@stripe/bun-toolkit": minor
---

Add `bun.assetRoot` config and fix compiled binary argv[0]

- **`bun.assetRoot`**: New optional field in package.json's `bun` config. When set, asset glob patterns are resolved relative to `assetRoot` instead of cwd, and manifest keys are relative to `assetRoot`. This allows packages nested in a monorepo to embed assets from a parent directory while keeping stable manifest keys that match what the consuming code expects.

- **argv fix**: Bun compiled binaries set `process.argv[0]` to the literal string `"bun"`, which causes CLI frameworks like yargs to display "bun" as the program name in help output. The generated entrypoint now rewrites `argv[0]` to the basename of `argv[1]` (the actual binary path) before the consumer's code runs.
