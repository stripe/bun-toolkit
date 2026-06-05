---
"@stripe/bun-toolkit": minor
---

Make the pre-compilation build script configurable via `bun.buildScript` in package.json. Defaults to `"prebuild-binary"`. If the script doesn't exist, the build step is skipped. This avoids hijacking the conventional `build` script name.
