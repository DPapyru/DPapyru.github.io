import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const suitePath = path.join(repoRoot, 'tmp-playwright/lib/suites.mjs');
const source = fs.readFileSync(suitePath, 'utf8');

test('IDE acceptance suite follows quick-create modal workflow and anim.ts smoke path', () => {
    assert.match(source, /#quick-create-modal/);
    assert.match(source, /#btn-quick-create-submit/);
    assert.match(source, /\.anim\.ts/);
    assert.doesNotMatch(source, /dialog\.type\(\) === 'prompt'/);
    assert.doesNotMatch(source, /\.animcs/);
});

test('IDE acceptance suite validates markdown visual preview instead of viewer iframe', () => {
    assert.match(source, /markdown-visual-canvas/);
    assert.match(source, /返回编辑/);
    assert.doesNotMatch(source, /viewer\.html\?[^\n]*studio_preview=1/);
});
