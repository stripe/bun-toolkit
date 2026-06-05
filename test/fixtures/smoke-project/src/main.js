// Smoke test binary: reads an embedded asset and prints it to stdout.
// This verifies the full pipeline: manifest generation → embedding → extraction.
//
// We use the bun-toolkit runtime to resolve assets. In the smoke test, the
// bun-toolkit dist is symlinked into node_modules so this import resolves.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {getAssetDir} from '@stripe/bun-toolkit/runtime';

const assetDir = getAssetDir('smoke-assets-');
const content = readFileSync(join(assetDir, 'assets', 'data.txt'), 'utf-8').trim();
console.log(`ASSET_CONTENT: ${content}`);
process.exit(0);
