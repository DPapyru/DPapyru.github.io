const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('article-studio html includes level simulation controls', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /id="studio-simulate-c-level"/);
    assert.match(html, /id="studio-simulate-t-level"/);
    assert.match(html, /模拟阅读/);
});

test('article-studio js includes simulated profile in preview payload', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.match(js, /simulateCLevel/);
    assert.match(js, /simulateTLevel/);
    assert.match(js, /simulatedProfile/);
});

test('viewer preview mode consumes simulated profile from payload', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.match(viewer, /simulatedProfile/);
    assert.match(viewer, /getLearningConditionContext/);
    assert.match(viewer, /readStudioPreviewPayloadFromStorage/);
});

test('viewer simulated profile keeps non-simulated dimension from stored profile', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.match(viewer, /simulated\.c\s*==\s*null\s*\?\s*baseProfile\.C/);
    assert.match(viewer, /simulated\.t\s*==\s*null\s*\?\s*baseProfile\.T/);
});
