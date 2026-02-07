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

test('viewer ai chat re-checks token before clearing on 401', () => {
    const htmlPath = path.resolve('site/pages/viewer.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const submitStart = html.indexOf('async function submitViewerAiChat()');
    const submitEnd = html.indexOf('function setupEvents()', submitStart);
    const submitBody = submitStart >= 0 && submitEnd > submitStart
        ? html.slice(submitStart, submitEnd)
        : '';

    assert.notEqual(submitBody, '', 'submitViewerAiChat should exist');
    assert.match(submitBody, /checkAuthTokenAgainstWorker\(authToken\)/);
    assert.match(submitBody, /AI 服务认证配置不一致/);
});

test('viewer ai panel uses near half-screen layout', () => {
    const htmlPath = path.resolve('site/pages/viewer.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /width:\s*clamp\(420px,\s*50vw,\s*860px\)/);
    assert.match(html, /max-height:\s*min\(82vh,\s*860px\)/);
    assert.match(html, /min-height:\s*clamp\(180px,\s*32vh,\s*420px\)/);
});

test('viewer ai response supports markdown rendering', () => {
    const htmlPath = path.resolve('site/pages/viewer.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /function\s+renderAiMarkdown\s*\(/);
    assert.match(html, /setAiOutput\(outputText,\s*\{\s*markdown:\s*true\s*\}\)/);
    assert.match(html, /viewer-ai-output--markdown/);
});

test('viewer ai panel exposes tutorial index action and warning notice', () => {
    const htmlPath = path.resolve('site/pages/viewer.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /id="viewer-ai-index"/);
    assert.match(html, /AI 生成内容可能不准确，请以教程原文为准/);
});

test('viewer ai chat builds prompt with article context and local index links', () => {
    const htmlPath = path.resolve('site/pages/viewer.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /function\s+buildAiSystemPrompt\s*\(/);
    assert.match(html, /function\s+getCurrentArticleContextForAi\s*\(/);
    assert.match(html, /function\s+buildTutorialIndexMarkdown\s*\(/);
    assert.match(html, /viewer\.html\?file=\$\{encodeURIComponent\(/);
    assert.match(html, /if\s*\(shouldUseIndexSuggestionMode\(prompt\)\)/);
});
