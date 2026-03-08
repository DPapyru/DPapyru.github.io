import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const testSource = fs.readFileSync(path.join(repoRoot, 'tml-ide-app/tests/anim-preview-compile-regressions.test.js'), 'utf8');

test('anim preview regression tests resolve fixture paths from their own location', () => {
    assert.match(testSource, /fileURLToPath\(import\.meta\.url\)/);
    assert.match(testSource, /path\.join\(repoRoot, 'site\/pages\/anim-renderer\.html'\)/);
    assert.match(testSource, /path\.join\(repoRoot, 'tml-ide-app\/src\/main\.js'\)/);
    assert.doesNotMatch(testSource, /path\.resolve\('site\/pages\/anim-renderer\.html'\)/);
    assert.doesNotMatch(testSource, /path\.resolve\('tml-ide-app\/src\/main\.js'\)/);
});
