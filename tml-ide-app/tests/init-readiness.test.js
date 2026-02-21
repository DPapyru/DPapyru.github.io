import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mainEntryPath = path.resolve(__dirname, '../src/main.js');
const acceptanceScriptPath = path.resolve(__dirname, '../../tmp-playwright/tml-ide-vscode-acceptance.mjs');

test('main entry keeps editor locked before initialization completes', () => {
    const source = fs.readFileSync(mainEntryPath, 'utf8');
    assert.match(source, /initialized:\s*false/);
    assert.match(source, /readOnly:\s*true/);
    assert.match(source, /state\.initialized\s*=\s*true/);
    assert.match(source, /updateOptions\(\{\s*readOnly:\s*false\s*\}\)/);
    assert.match(source, /isReady\(\)/);
    assert.match(source, /requestAnalyzeAtCursor/);
});

test('acceptance script validates runtime fingerprint and Item completion scenario', () => {
    const source = fs.readFileSync(acceptanceScriptPath, 'utf8');
    assert.match(source, /runtimeFingerprint/);
    assert.match(source, /Runtime bundle mismatch/);
    assert.match(source, /Control\+Shift\+P/);
    assert.match(source, /data-panel-tab="indexer"/);
    assert.match(source, /Item\./);
    assert.match(source, /hasDamage/);
    assert.match(source, /override/);
    assert.match(source, /SetDefaults/);
    assert.match(source, /problems-list/);
});
