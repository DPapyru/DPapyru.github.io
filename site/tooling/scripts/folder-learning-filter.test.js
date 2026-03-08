const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('folder page keeps article list routing independent from learning profile filters', () => {
    const htmlPath = path.resolve('site/pages/folder.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /目录下文章不会按学习路径分流/);
    assert.doesNotMatch(html, /setPref\('showUnmapped'/);
    assert.doesNotMatch(html, /setPref\('showAll'/);
});

test('folder page script supports path q sort query params', () => {
    const htmlPath = path.resolve('site/pages/folder.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /searchParams\.get\('path'\)/);
    assert.match(html, /searchParams\.get\('q'\)/);
    assert.match(html, /searchParams\.get\('sort'\)/);
});

test('folder page canonical builder keeps only path query parameter', () => {
    const htmlPath = path.resolve('site/pages/folder.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /url\.searchParams\.delete\('q'\)/);
    assert.match(html, /url\.searchParams\.delete\('sort'\)/);
    assert.match(html, /url\.searchParams\.set\('path',\s*normalizedPath\)/);
});
