const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('article-studio html uses lazyvim-inspired workspace shell', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /class="studio-statusline"/);
    assert.match(html, /class="studio-lazy-workspace"/);
    assert.match(html, /studio-lazy-column--left/);
    assert.match(html, /studio-lazy-column--center/);
    assert.match(html, /studio-lazy-column--right/);
    assert.match(html, /class="studio-panel-title"/);
    assert.match(html, /class="studio-panel-section"/);
});

test('article-studio html keeps modern simplified flow and collapses advanced actions', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(html, /专注模式/);
    assert.match(html, /class="studio-quick-actions"/);
    assert.match(html, /<summary>更多操作<\/summary>/);
    assert.match(html, /<summary>高级发布选项<\/summary>/);
});

test('article-studio css defines lazyvim-like shell and modern panel tokens', () => {
    const cssPath = path.resolve('site/assets/css/article-studio.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.match(css, /\.studio-lazy-workspace\s*\{/);
    assert.match(css, /\.studio-lazy-column\s*\{/);
    assert.match(css, /\.studio-panel-title\s*\{/);
    assert.match(css, /\.studio-panel-section\s*\{/);
    assert.match(css, /\.studio-quick-actions\s*\{/);
    assert.match(css, /\.studio-advanced-panel\s*\{/);
});

test('article-studio css aligns bottom edges and keeps status line single-row', () => {
    const cssPath = path.resolve('site/assets/css/article-studio.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.match(css, /align-items:\s*stretch/);
    assert.match(css, /#studio-status\s*\{/);
    assert.match(css, /white-space:\s*nowrap/);
    assert.match(css, /text-overflow:\s*ellipsis/);
});
