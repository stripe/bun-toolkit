#!/usr/bin/env bash
# Builds native binary versions of a project using Bun's compile feature.
#
# Usage: bun-build-binaries [output_dir] [targets]
#   output_dir: Optional. Output directory for binaries (default: ./bin)
#   targets:    Optional. Comma-separated list of targets
#               (default: all supported platforms).
#
# Called from a consumer package root. The consumer must have a `bin` entry
# in its package.json pointing at the JS entry point.
#
# If the consumer declares `bun.assets` globs in package.json, this script
# generates an embedded manifest entrypoint that uses Bun's
# `import ... with { type: "file" }` to embed all assets directly in the
# binary, producing a single self-contained executable.

set -euo pipefail

REQUIRED_BUN_VERSION="1.3.13"

require_bun() {
  if ! command -v bun >/dev/null 2>&1; then
    cat >&2 <<EOF
ERROR: 'bun' was not found on PATH.

bun-build-binaries uses Bun (https://bun.sh) to compile standalone binaries.
Bun ${REQUIRED_BUN_VERSION} or newer is required.

Install Bun by one of:

  # Official installer:
  curl -fsSL https://bun.sh/install | bash

  # Homebrew:
  brew install oven-sh/bun/bun

  # mise / asdf:
  mise install bun
EOF
    exit 1
  fi

  local bun_version_raw bun_version lowest
  bun_version_raw=$(bun --version 2>/dev/null || echo "")
  bun_version="${bun_version_raw%%[-+]*}"

  if [[ ! "$bun_version" =~ ^[0-9]+(\.[0-9]+){0,2}$ ]]; then
    cat >&2 <<EOF
ERROR: could not determine a usable Bun version from 'bun --version'
       (got: '${bun_version_raw}').

Bun ${REQUIRED_BUN_VERSION} or newer is required.
EOF
    exit 1
  fi

  lowest=$(printf '%s\n%s\n' "$REQUIRED_BUN_VERSION" "$bun_version" | sort -V | head -n1)
  if [ "$lowest" != "$REQUIRED_BUN_VERSION" ]; then
    cat >&2 <<EOF
ERROR: Bun ${bun_version_raw} is older than the required ${REQUIRED_BUN_VERSION}.

Upgrade Bun: curl -fsSL https://bun.sh/install | bash
EOF
    exit 1
  fi

  echo "Using Bun ${bun_version_raw} (from $(command -v bun))"
}

require_bun

# Supported targets
default_targets="macos-arm64,macos-x64,linux-x64,linux-arm64,win-x64"

# Accept and ignore -d/--debug for backwards-compat
if [[ "${1:-}" == "-d" || "${1:-}" == "--debug" ]]; then
  shift
fi

# Parse arguments
out_dir="${1:-$PWD/bin}"
targets="${2:-$default_targets}"

if [ ! -f "package.json" ]; then
  echo "ERROR: No package.json found in current directory." >&2
  exit 1
fi

# Get the binary name and entry point from package.json
binary_name=$(jq -r '.bin | to_entries | .[0].key' package.json)
entry_point=$(jq -r '.bin | to_entries | .[0].value' package.json)

if [ "$binary_name" = "null" ] || [ -z "$binary_name" ]; then
  echo "ERROR: No bin entry found in package.json" >&2
  exit 1
fi

if [ "$entry_point" = "null" ] || [ -z "$entry_point" ]; then
  echo "ERROR: No bin entry point found in package.json" >&2
  exit 1
fi

echo "Building $binary_name binaries for target(s): $targets into $out_dir"
echo "Entry point: $entry_point"

if [ -e "$out_dir" ]; then
  rm -rf "$out_dir"
fi
mkdir -p "$out_dir"

# Run the consumer's build script if it exists.
# Reads bun.buildScript from package.json (default: "prebuild-binary").
build_script=$(jq -r '.bun.buildScript // empty' package.json)
if [ -z "$build_script" ]; then
  build_script="prebuild-binary"
fi

# Ensure NODE_AUTH_TOKEN is set (even to empty) so package managers don't
# choke on ${NODE_AUTH_TOKEN} in .npmrc when running scripts locally.
export NODE_AUTH_TOKEN="${NODE_AUTH_TOKEN:-}"

if jq -e --arg s "$build_script" '.scripts | has($s)' package.json >/dev/null 2>&1; then
  echo "Running build script: $build_script"
  if [ -f "pnpm-lock.yaml" ]; then
    pnpm run "$build_script"
  elif [ -f "yarn.lock" ]; then
    yarn run "$build_script"
  elif [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
    bun run "$build_script"
  else
    npm run "$build_script"
  fi
else
  echo "No '$build_script' script found in package.json, skipping build step"
fi

# Generate embedded asset manifest if bun.assets is declared.
# Resolve symlinks so SCRIPT_DIR points to the real scripts/ directory even
# when invoked via an npm .bin/ symlink.
_source="${BASH_SOURCE[0]}"
while [ -L "$_source" ]; do
  _dir="$(cd "$(dirname "$_source")" && pwd)"
  _source="$(readlink "$_source")"
  [[ "$_source" != /* ]] && _source="$_dir/$_source"
done
SCRIPT_DIR="$(cd "$(dirname "$_source")" && pwd)"
"$SCRIPT_DIR/generate-manifest.sh"

# Use the embedded manifest entrypoint if it was generated, otherwise
# fall back to the declared entry point (for projects with no assets).
if [ -f "dist/bun-compile-entrypoint.js" ]; then
  compile_entry="./dist/bun-compile-entrypoint.js"
  echo "Using embedded asset entrypoint: $compile_entry"
else
  compile_entry="$entry_point"
fi

# Map target tokens to Bun target identifiers
map_target() {
  case "$1" in
    macos-arm64|node18-macos-arm64) echo "bun-darwin-arm64|macos|arm64|" ;;
    macos-x64|node18-macos-x64)     echo "bun-darwin-x64|macos|x64|" ;;
    linux-x64|node18-linux-x64)     echo "bun-linux-x64|linux|x64|" ;;
    linux-arm64|node18-linux-arm64) echo "bun-linux-arm64|linux|arm64|" ;;
    win-x64|node18-win-x64)         echo "bun-windows-x64|win|x64|.exe" ;;
    *) return 1 ;;
  esac
}

# Split comma-separated targets into an array
IFS=',' read -r -a target_array <<< "$targets"
target_count=${#target_array[@]}

for target in "${target_array[@]}"; do
  mapping=$(map_target "$target") || {
    echo "ERROR: unsupported target '$target'. Supported: $default_targets" >&2
    exit 1
  }
  IFS='|' read -r bun_target os_tok arch_tok exe_suffix <<< "$mapping"

  if [ "$target_count" -eq 1 ]; then
    out_path="$out_dir/${binary_name}${exe_suffix}"
  else
    out_path="$out_dir/${binary_name}-${os_tok}-${arch_tok}${exe_suffix}"
  fi

  echo "==> bun build --compile --target=${bun_target} --outfile=${out_path} ${compile_entry}"
  bun build --compile --target="$bun_target" --outfile="$out_path" "$compile_entry"
done

echo ""
echo "Binaries built successfully in $out_dir:"
ls -lh "$out_dir/"
