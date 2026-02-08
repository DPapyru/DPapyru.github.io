const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('article-studio html no longer includes level simulation controls', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.doesNotMatch(html, /id="studio-simulate-c-level"/);
    assert.doesNotMatch(html, /id="studio-simulate-t-level"/);
    assert.doesNotMatch(html, /模拟阅读/);
});

test('article-studio js no longer includes simulated profile in preview payload', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.doesNotMatch(js, /simulateCLevel/);
    assert.doesNotMatch(js, /simulateTLevel/);
    assert.doesNotMatch(js, /simulatedProfile/);
});

test('viewer preview mode no longer consumes simulated profile from payload', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.doesNotMatch(viewer, /simulatedProfile/);
    assert.match(viewer, /getLearningConditionContext/);
    assert.match(viewer, /readStudioPreviewPayloadFromStorage/);
});

test('viewer no longer keeps simulated profile fallback logic', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.doesNotMatch(viewer, /baseProfile\.C/);
    assert.doesNotMatch(viewer, /baseProfile\.T/);
});
