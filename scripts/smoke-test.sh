#!/usr/bin/env bash
# Smoke test for the bun-toolkit binary pipeline.
#
# Builds a minimal fixture project into a self-contained binary, then runs it
# from a foreign working directory to verify:
#   1. The binary is self-contained (no companion files needed)
#   2. Embedded assets are readable at runtime
#   3. The getAssetDir() / resolveAsset() runtime works correctly
#
# Usage: ./scripts/smoke-test.sh
#        (run from the bun-toolkit repo root)
#
# Requires: Bun

set -euo pipefail

TOOLKIT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE_DIR="$TOOLKIT_ROOT/test/fixtures/smoke-project"
EXPECTED_MARKER="SMOKE_EMBEDDED_ASSET_MARKER"

echo "=== bun-toolkit smoke test ==="
echo "  Toolkit root: $TOOLKIT_ROOT"
echo "  Fixture: $FIXTURE_DIR"
echo ""

# Step 1: Build bun-toolkit itself
echo "[1/5] Building bun-toolkit..."
cd "$TOOLKIT_ROOT"
pnpm build

# Step 2: Set up the fixture to use the local bun-toolkit
echo "[2/5] Setting up fixture..."
cd "$FIXTURE_DIR"
rm -rf node_modules dist bin
mkdir -p node_modules/@stripe dist

# Symlink bun-toolkit dist into the fixture's node_modules
ln -sf "$TOOLKIT_ROOT" node_modules/@stripe/bun-toolkit

# Build the fixture (just copies src/main.js → dist/main.js)
cp src/main.js dist/main.js

# Step 3: Generate the embedded manifest
echo "[3/5] Generating embedded manifest..."
"$TOOLKIT_ROOT/scripts/generate-manifest.sh"

if [ ! -f "dist/bun-compile-entrypoint.js" ]; then
  echo "FAIL: dist/bun-compile-entrypoint.js was not generated" >&2
  exit 1
fi

echo "  Entrypoint contents:"
head -5 dist/bun-compile-entrypoint.js | sed 's/^/    /'
echo "    ..."

# Step 4: Compile the binary
echo "[4/5] Compiling binary..."
# Detect host platform
case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) target="bun-darwin-arm64" ;;
  Darwin-x86_64) target="bun-darwin-x64" ;;
  Linux-x86_64) target="bun-linux-x64" ;;
  Linux-aarch64) target="bun-linux-arm64" ;;
  *) echo "FAIL: unsupported host platform" >&2; exit 1 ;;
esac

mkdir -p bin
bun build --compile --target="$target" --outfile bin/smoke-test ./dist/bun-compile-entrypoint.js

if [ ! -f "bin/smoke-test" ]; then
  echo "FAIL: binary was not produced at bin/smoke-test" >&2
  exit 1
fi

echo "  Binary size: $(du -h bin/smoke-test | cut -f1)"

# Step 5: Run the binary from a foreign cwd
echo "[5/5] Running binary from foreign directory..."
foreign_dir=$(mktemp -d)
trap 'rm -rf "$foreign_dir"' EXIT

output=$(cd "$foreign_dir" && "$FIXTURE_DIR/bin/smoke-test" 2>&1) || {
  echo "FAIL: binary exited with non-zero status" >&2
  echo "  Output: $output" >&2
  exit 1
}

if echo "$output" | grep -q "ASSET_CONTENT: $EXPECTED_MARKER"; then
  echo ""
  echo "=== PASS ==="
  echo "  Binary is self-contained and embedded assets are readable."
  echo "  Output: $output"
else
  echo "FAIL: expected 'ASSET_CONTENT: $EXPECTED_MARKER' in output" >&2
  echo "  Got: $output" >&2
  exit 1
fi

# Cleanup fixture build artifacts
rm -rf "$FIXTURE_DIR/node_modules" "$FIXTURE_DIR/dist" "$FIXTURE_DIR/bin"
