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
    assert.match(html, /id="btn-shader-preview-popup"/);
    assert.match(html, /id="shader-preview-modal"/);
    assert.match(html, /id="btn-shader-preview-close"/);
    assert.match(html, /id="shader-preview-modal-backdrop"/);
    assert.match(html, /id="shader-preview-canvas"/);
    assert.match(html, /id="shader-preset-image"/);
    assert.match(html, /id="shader-render-mode"/);
    assert.match(html, /id="shader-address-mode"/);
    assert.match(html, /id="shader-bg-mode"/);
    assert.match(html, /id="shader-upload-0"/);
    assert.match(html, /id="shader-upload-1"/);
    assert.match(html, /id="shader-upload-2"/);
    assert.match(html, /id="shader-upload-3"/);
    assert.doesNotMatch(html, /id="shader-sidepane"/);
    assert.doesNotMatch(html, /id="shader-pip"/);
});

test('main.js defines shaderfx language assist and template flow', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /languageForFile\(pathValue\)[\s\S]*mode === 'shaderfx'[\s\S]*'shaderfx'/);
    assert.match(source, /function registerShaderFxLanguageSupport/);
    assert.match(source, /monaco\.languages\.register\(\{\s*id:\s*'shaderfx'\s*\}\)/);
    assert.match(source, /setMonarchTokensProvider\('shaderfx'/);
    assert.match(source, /registerCompletionItemProvider\('shaderfx'/);
    assert.match(source, /function shaderDefaultTemplate/);
    assert.match(source, /function drawShaderPreviewCanvas/);
    assert.match(source, /function shaderPreviewImageCanvas/);
    assert.match(source, /shaderRenderMode/);
    assert.match(source, /shaderBgMode/);
    assert.doesNotMatch(source, /function installShaderPipInteractions/);
    assert.match(source, /btnShaderInsertTemplate/);
    assert.match(source, /btnShaderPreviewPopup/);
    assert.match(source, /shaderPreviewModal/);
    assert.match(source, /function setShaderPreviewModalOpen/);
    assert.match(source, /已插入 Shader 默认模板/);
    assert.match(source, /shaderUploads:\s*\[/);
    assert.match(source, /shaderUploadInputs:\s*\[/);
    assert.match(source, /function handleShaderUploadChange/);
    assert.match(source, /function clearShaderUploadSlot/);
    assert.doesNotMatch(source, /shaderSidepane/);
    assert.doesNotMatch(source, /createRadialGradient\(/);
    assert.doesNotMatch(source, /未检测到 float4 像素着色器入口函数/);
    assert.match(source, /technique\s+\w+/);
    assert.match(source, /pass\s+\w+/);
});

test('main.js applies default .fx template when creating shader files', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
    assert.match(source, /detectFileMode\(fileName\) === 'shaderfx'\s*\?\s*shaderDefaultTemplate\(\)\s*:\s*''/);
});
