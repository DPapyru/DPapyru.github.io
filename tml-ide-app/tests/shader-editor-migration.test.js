import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

test('index.html exposes shader template insertion action in compile panel', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(html, /id="shader-compile-group"/);
    assert.match(html, /id="btn-shader-insert-template"/);
});

test('main.js defines shaderfx language assist and template flow', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /languageForFile\(pathValue\)[\s\S]*mode === 'shaderfx'[\s\S]*'shaderfx'/);
    assert.match(source, /function registerShaderFxLanguageSupport/);
    assert.match(source, /monaco\.languages\.register\(\{\s*id:\s*'shaderfx'\s*\}\)/);
    assert.match(source, /setMonarchTokensProvider\('shaderfx'/);
    assert.match(source, /registerCompletionItemProvider\('shaderfx'/);
    assert.match(source, /function shaderDefaultTemplate/);
    assert.match(source, /btnShaderInsertTemplate/);
    assert.match(source, /已插入 Shader 默认模板/);
});

test('main.js applies default .fx template when creating shader files', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
    assert.match(source, /detectFileMode\(fileName\) === 'shaderfx'\s*\?\s*shaderDefaultTemplate\(\)\s*:\s*''/);
});
