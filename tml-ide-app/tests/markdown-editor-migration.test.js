import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

test('index.html exposes markdown insertion buttons migrated from article-studio', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

    assert.match(html, /id="markdown-toolbox-group"/);
    assert.match(html, /id="image-preview-pane"/);
    assert.match(html, /id="image-preview-image"/);
    assert.match(html, /data-md-insert="bold"/);
    assert.match(html, /data-md-insert="h2"/);
    assert.match(html, /data-md-insert="list"/);
    assert.match(html, /data-md-insert="quote"/);
    assert.match(html, /data-md-insert="ref"/);
    assert.match(html, /data-md-insert="anim"/);
    assert.match(html, /data-md-insert="animcs-block"/);
    assert.match(html, /data-md-insert="color-inline"/);
    assert.match(html, /data-md-insert="color-change-inline"/);
    assert.match(html, /data-md-insert="quiz-tf"/);
    assert.match(html, /data-md-insert="quiz-choice"/);
    assert.match(html, /data-md-insert="quiz-multi"/);
});

test('main.js wires markdown insert actions and Ctrl+V image paste flow', () => {
    const source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

    assert.match(source, /markdownInsertButtons/);
    assert.match(source, /function applyMarkdownInsertAction/);
    assert.match(source, /function wrapMarkdownSelection/);
    assert.match(source, /function insertMarkdownBlockSnippet/);
    assert.match(source, /function collectClipboardImageFiles/);
    assert.match(source, /function insertPastedMarkdownImages/);
    assert.match(source, /function createWorkspaceImageFileFromPaste/);
    assert.match(source, /function imagePreviewSrcFromActiveFile/);
    assert.match(source, /addEventListener\('paste'/);
    assert.match(source, /已粘贴图片/);
    assert.match(source, /detectFileMode\(pathValue\)[\s\S]*'image'/);
});
