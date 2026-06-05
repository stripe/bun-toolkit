import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(actual.existsSync),
    mkdirSync: vi.fn(),
    mkdtempSync: vi.fn(() => '/tmp/bun-toolkit-assets-abc123'),
    readFileSync: vi.fn(() => Buffer.from('mock content')),
    writeFileSync: vi.fn(),
    rmSync: vi.fn(),
  };
});

describe('embedded-assets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete globalThis.__EMBEDDED_ASSET_MANIFEST__;
  });

  afterEach(() => {
    delete globalThis.__EMBEDDED_ASSET_MANIFEST__;
  });

  describe('getAssetDir() — dev mode', () => {
    it('returns repo root when no manifest is set', async () => {
      const {getAssetDir} = await import('./embedded-assets');
      const result = getAssetDir();
      // In dev mode, should be one directory up from __dirname (which is src/runtime)
      expect(result).toBe(path.resolve(__dirname, '..'));
    });
  });

  describe('getAssetDir() — embedded mode', () => {
    it('extracts all files to a temp directory', async () => {
      globalThis.__EMBEDDED_ASSET_MANIFEST__ = {
        'openapi/spec.yaml': '/bunfs/spec.yaml',
        'src/go/static/context.go': '/bunfs/context.go',
      };
      const {getAssetDir} = await import('./embedded-assets');

      const result = getAssetDir();

      expect(result).toBe('/tmp/bun-toolkit-assets-abc123');
      expect(fs.mkdtempSync).toHaveBeenCalledWith(
        path.join(os.tmpdir(), 'bun-toolkit-assets-'),
      );
      expect(fs.mkdirSync).toHaveBeenCalledTimes(2);
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.readFileSync).toHaveBeenCalledWith('/bunfs/spec.yaml');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/tmp/bun-toolkit-assets-abc123/openapi/spec.yaml',
        expect.anything(),
      );
      expect(fs.readFileSync).toHaveBeenCalledWith('/bunfs/context.go');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/tmp/bun-toolkit-assets-abc123/src/go/static/context.go',
        expect.anything(),
      );
    });

    it('only extracts once on repeated calls', async () => {
      globalThis.__EMBEDDED_ASSET_MANIFEST__ = {
        'file.txt': '/bunfs/file.txt',
      };
      const {getAssetDir} = await import('./embedded-assets');

      const first = getAssetDir();
      const second = getAssetDir();

      expect(first).toBe(second);
      expect(fs.mkdtempSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });

    it('uses custom temp prefix', async () => {
      globalThis.__EMBEDDED_ASSET_MANIFEST__ = {
        'file.txt': '/bunfs/file.txt',
      };
      const {getAssetDir} = await import('./embedded-assets');

      getAssetDir('stripe-codegen-assets-');

      expect(fs.mkdtempSync).toHaveBeenCalledWith(
        path.join(os.tmpdir(), 'stripe-codegen-assets-'),
      );
    });

    it('registers cleanup on process exit', async () => {
      const onSpy = vi.spyOn(process, 'on');
      globalThis.__EMBEDDED_ASSET_MANIFEST__ = {
        'file.txt': '/bunfs/file.txt',
      };
      const {getAssetDir} = await import('./embedded-assets');

      getAssetDir();

      expect(onSpy).toHaveBeenCalledWith('exit', expect.any(Function));
      onSpy.mockRestore();
    });
  });

  describe('isEmbedded()', () => {
    it('returns false in dev mode', async () => {
      const {isEmbedded} = await import('./embedded-assets');
      expect(isEmbedded()).toBe(false);
    });

    it('returns true when manifest is set', async () => {
      globalThis.__EMBEDDED_ASSET_MANIFEST__ = {'file.txt': '/bunfs/file.txt'};
      const {isEmbedded} = await import('./embedded-assets');
      expect(isEmbedded()).toBe(true);
    });
  });

  describe('resolveAsset()', () => {
    it('joins segments to the asset dir in dev mode', async () => {
      const {resolveAsset, getAssetDir} = await import('./embedded-assets');
      const expected = path.join(getAssetDir(), 'openapi', 'spec.yaml');
      expect(resolveAsset('openapi', 'spec.yaml')).toBe(expected);
    });

    it('joins segments to the asset dir in embedded mode', async () => {
      globalThis.__EMBEDDED_ASSET_MANIFEST__ = {
        'openapi/spec.yaml': '/bunfs/spec.yaml',
      };
      const {resolveAsset} = await import('./embedded-assets');

      expect(resolveAsset('openapi', 'spec.yaml')).toBe(
        '/tmp/bun-toolkit-assets-abc123/openapi/spec.yaml',
      );
    });
  });
});
