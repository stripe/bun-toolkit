/**
 * Runtime helpers for accessing assets embedded in Bun-compiled binaries.
 *
 * How it works:
 *
 *   Build time: `bun-generate-manifest` reads bun.assets globs from the
 *   consumer's package.json, writes dist/bun-compile-entrypoint.js with
 *   `import ... with { type: "file" }` statements, and sets
 *   globalThis.__EMBEDDED_ASSET_MANIFEST__ before importing the bundle.
 *
 *   Binary mode: `getAssetDir()` extracts all embedded files to a temp
 *   directory on first call and returns that path. Cleanup runs on exit.
 *
 *   Dev mode: `getAssetDir()` returns the repo root, where assets exist
 *   on disk in their original locations.
 */
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import * as path from 'node:path';

declare global {
  // eslint-disable-next-line no-var
  var __EMBEDDED_ASSET_MANIFEST__: Record<string, string> | undefined;
}

let extractedDir: string | null = null;

const getManifest = (): Record<string, string> | null => {
  return globalThis.__EMBEDDED_ASSET_MANIFEST__ ?? null;
};

const repoRoot = (): string => {
  // When bundled by esbuild into a consumer's dist/, __dirname is the
  // consumer's dist/ directory. The repo root is one level up.
  return path.resolve(__dirname, '..');
};

const extractAll = (tempPrefix: string): string => {
  const manifest = getManifest();
  if (!manifest) {
    throw new Error('extractAll called but no embedded asset manifest is present');
  }

  const tmpDir = mkdtempSync(path.join(tmpdir(), tempPrefix));

  for (const [logicalPath, bunfsPath] of Object.entries(manifest)) {
    const destPath = path.join(tmpDir, logicalPath);
    mkdirSync(path.dirname(destPath), {recursive: true});
    // Use readFileSync + writeFileSync instead of copyFileSync because
    // Bun's $bunfs/ virtual paths don't support kernel-level copy syscalls
    // (sendfile/copy_file_range) that copyFileSync uses on Linux.
    writeFileSync(destPath, readFileSync(bunfsPath));
  }

  process.on('exit', () => {
    try {
      rmSync(tmpDir, {recursive: true, force: true});
    } catch {
      // Process is exiting — nothing useful to do with the error
    }
  });

  return tmpDir;
};

/**
 * Returns the root directory where assets can be found via filesystem paths.
 *
 * In a Bun-compiled binary: extracts all embedded assets to a temp directory
 * on first call and returns that path. Assets are laid out matching their
 * original repo-relative paths (e.g., `openapi/spec.yaml`, `src/go/static/...`).
 * The temp directory is cleaned up on process exit.
 *
 * In dev mode (Node/tsx/vitest): returns the repo root, where assets exist
 * on disk in their original locations.
 *
 * @param tempPrefix - Prefix for the temp directory name (default: `'bun-toolkit-assets-'`).
 */
export const getAssetDir = (tempPrefix = 'bun-toolkit-assets-'): string => {
  if (!getManifest()) {
    return repoRoot();
  }

  if (!extractedDir) {
    extractedDir = extractAll(tempPrefix);
  }

  return extractedDir;
};

/**
 * Returns true if running inside a Bun-compiled binary with embedded assets.
 */
export const isEmbedded = (): boolean => {
  return getManifest() !== null;
};

/**
 * Resolve a specific asset file path relative to the asset root.
 *
 * @example
 * ```ts
 * import { resolveAsset } from '@stripe/bun-toolkit/runtime'
 * const spec = resolveAsset('openapi/spec.yaml')
 * ```
 *
 * @param segments - Path segments relative to the asset root.
 */
export const resolveAsset = (...segments: string[]): string => {
  return path.join(getAssetDir(), ...segments);
};
