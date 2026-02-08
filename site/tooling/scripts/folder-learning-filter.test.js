const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('folder page does not render learning toggle actions', () => {
    const htmlPath = path.resolve('site/pages/folder.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.doesNotMatch(html, /makeToggle\('显示未标注'/);
    assert.doesNotMatch(html, /makeToggle\('显示全部'/);
    assert.doesNotMatch(html, /setPref\('showUnmapped'/);
    assert.doesNotMatch(html, /setPref\('showAll'/);
});

test('learning-path filter keeps unmapped docs visible with profile', () => {
    const jsPath = path.resolve('site/assets/js/learning-paths.js');
    const js = fs.readFileSync(jsPath, 'utf8');

    assert.match(js, /if\s*\(!rule\)\s*\{[\s\S]*counts\.unmapped\s*\+=\s*1;[\s\S]*visible\.push\(doc\);/);
    assert.match(js, /isStrict:\s*false/);
});

test('folder page labels list mode as non-filtered by routing', () => {
    const htmlPath = path.resolve('site/pages/folder.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /文章列表不做分流/);
});
