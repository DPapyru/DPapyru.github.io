const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('article-studio html no longer exposes ai chat controls', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.doesNotMatch(html, /id="studio-ai-endpoint"/);
    assert.doesNotMatch(html, /id="studio-ai-input"/);
    assert.doesNotMatch(html, /id="studio-ai-send"/);
    assert.doesNotMatch(html, /id="studio-ai-cooldown"/);
    assert.doesNotMatch(html, /id="studio-ai-output"/);
});

test('viewer html exposes floating ai chat controls', () => {
    const htmlPath = path.resolve('site/pages/viewer.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /id="viewer-ai-fab"/);
    assert.match(html, /id="viewer-ai-panel"/);
    assert.match(html, /id="viewer-ai-input"/);
    assert.match(html, /id="viewer-ai-send"/);
    assert.match(html, /id="viewer-ai-cooldown"/);
    assert.match(html, /id="viewer-ai-output"/);
});

test('viewer ai chat enforces github auth and cooldown', () => {
    const htmlPath = path.resolve('site/pages/viewer.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /VIEWER_AI_COOLDOWN_SECONDS\s*=\s*120/);
    assert.match(html, /VIEWER_AI_ENDPOINT\s*=\s*['"]https:\/\/[^'"]+\/functions\/v1\/ai-chat['"]/);
    assert.match(html, /function\s+submitViewerAiChat\s*\(/);
    assert.match(html, /请先点击“GitHub 登录”后再使用 AI 对话/);
    assert.match(html, /retry_after_sec/);
});

test('viewer ai floating button supports drag and persisted position', () => {
    const htmlPath = path.resolve('site/pages/viewer.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /VIEWER_AI_FAB_POSITION_STORAGE_KEY\s*=\s*['"]viewerAiFabPosition\.v1['"]/);
    assert.match(html, /function\s+setupFabDrag\s*\(/);
    assert.match(html, /function\s+snapFabToEdge\s*\(/);
    assert.match(html, /snapFabToEdge\s*\(/);
    assert.match(html, /pointerdown/);
    assert.match(html, /touch-action:\s*none/);
    assert.match(html, /data-panel-align/);
});

test('viewer auth verification keeps token on non-401 errors', () => {
    const htmlPath = path.resolve('site/pages/viewer.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const fnStart = html.indexOf('async function verifyAuthSession()');
    const fnEnd = html.indexOf('function toggleAiPanel', fnStart);
    const verifyAuthBody = fnStart >= 0 && fnEnd > fnStart
        ? html.slice(fnStart, fnEnd)
        : '';

    assert.notEqual(verifyAuthBody, '', 'verifyAuthSession should exist');
    assert.match(verifyAuthBody, /if\s*\(response\.status\s*===\s*401\)/);
});
