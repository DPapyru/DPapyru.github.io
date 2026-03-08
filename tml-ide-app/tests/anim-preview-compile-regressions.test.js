import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

test('anim renderer run button uses currentFile instead of out-of-scope file variable', () => {
    const sourcePath = path.join(repoRoot, 'site/pages/anim-renderer.html');
    const source = fs.readFileSync(sourcePath, 'utf8');

    const runHandlerMatch = source.match(/runBtn\.addEventListener\('click',\s*(?:async\s+)?function \(\) \{([\s\S]*?)\n\s*}\);/);
    assert.ok(runHandlerMatch && runHandlerMatch[1], 'runBtn click handler not found');

    const handlerBody = runHandlerMatch[1];
    assert.match(handlerBody, /currentFile/);
    assert.doesNotMatch(handlerBody, /mountPath\(file\.name/);
});

test('anim preview compile path uses TypeScript transpile output instead of raw source passthrough', () => {
    const sourcePath = path.join(repoRoot, 'tml-ide-app/src/main.js');
    const source = fs.readFileSync(sourcePath, 'utf8');

    assert.match(source, /getTypeScriptWorker/);
    assert.match(source, /getEmitOutput/);
    assert.doesNotMatch(source, /const moduleJs = String\(sourceText \|\| ''\);/);
});
