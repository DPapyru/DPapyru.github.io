import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');
const builtRoot = path.join(repoRoot, 'tml-ide');
const builtAssetsRoot = path.join(builtRoot, 'assets');

function toGitPath(filePath) {
    return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function assertTracked(filePath) {
    execFileSync('git', ['ls-files', '--error-unmatch', toGitPath(filePath)], {
        cwd: repoRoot,
        stdio: 'ignore'
    });
}

test('built IDE html references tracked assets and generated assets are all tracked', () => {
    const html = fs.readFileSync(path.join(builtRoot, 'index.html'), 'utf8');
    const referencedAssets = Array.from(html.matchAll(/\/tml-ide\/assets\/([^"')\s>]+)/g), (match) => match[1]);
    assert.ok(referencedAssets.length > 0, 'expected built IDE html to reference assets');

    for (const assetName of referencedAssets) {
        const assetPath = path.join(builtAssetsRoot, assetName);
        assert.ok(fs.existsSync(assetPath), `missing built asset: ${assetName}`);
        assertTracked(assetPath);
    }

    const generatedAssets = fs.readdirSync(builtAssetsRoot, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(builtAssetsRoot, entry.name));
    assert.ok(generatedAssets.length > 0, 'expected built assets directory to contain files');

    for (const assetPath of generatedAssets) {
        assertTracked(assetPath);
    }
});
