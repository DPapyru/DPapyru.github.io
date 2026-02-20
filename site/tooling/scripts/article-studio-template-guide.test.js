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

test('article-studio html/css follow latest ide layout requests', () => {
    const htmlPath = path.resolve('site/pages/article-studio.html');
    const cssPath = path.resolve('site/assets/css/article-studio.css');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.doesNotMatch(html, /studio-terminal-dock/);
    assert.match(html, />EXPLORER<\/button>/);
    assert.match(html, />SEARCH<\/button>/);
    assert.match(html, />PREVIEW<\/button>/);
    assert.match(html, />RELEASE<\/button>/);
    assert.match(html, />SETTINGS<\/button>/);
    assert.match(css, /#studio-right-panel-modal\s*\{[^}]*font-size:\s*15px;/);
    assert.match(css, /\.studio-command-proxy\s*\{[^}]*font-size:\s*15px;/);
    assert.match(css, /\.studio-style-command-name\s*\{[^}]*font-size:\s*17px;/);
});

test('article-studio tabs are closable from the ui', () => {
    const jsPath = path.resolve('site/assets/js/article-studio.js');
    const cssPath = path.resolve('site/assets/css/article-studio.css');
    const js = fs.readFileSync(jsPath, 'utf8');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.match(js, /function closeTabByPath\(/);
    assert.match(js, /data-tab-close-path/);
    assert.match(js, /\[data-tab-close-path\]/);
    assert.match(css, /\.studio-tab-close\s*\{/);
});

test('article-studio left explorer area uses larger readable scale', () => {
    const cssPath = path.resolve('site/assets/css/article-studio.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.match(css, /\.studio-lazy-workspace\s*\{[^}]*grid-template-columns:\s*112px 300px minmax\(0,\s*1fr\) 368px;/);
    assert.match(css, /\.studio-activity-btn\s*\{[^}]*font-size:\s*12px;/);
    assert.match(css, /#studio-left-panel-modal\s*\{[^}]*font-size:\s*14px;/);
    assert.match(css, /#studio-left-panel-modal\s+\.studio-tree-name\s*\{[^}]*font-size:\s*14px;/);
    assert.match(css, /#studio-left-panel-modal\s+\.studio-tree-item,[^}]*min-height:\s*32px;/);
});

test('article-studio ide fonts follow project dual-font stack', () => {
    const cssPath = path.resolve('site/assets/css/article-studio.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.match(css, /\.studio-command-proxy\s*\{[^}]*font-family:\s*var\(--font-family-tutorial\);/);
    assert.match(css, /\.studio-panel-mini-title\s*\{[^}]*font-family:\s*var\(--font-family-tutorial\);/);
    assert.match(css, /\.studio-lazy-workspace \.btn\s*\{[^}]*font-family:\s*var\(--font-family-tutorial\);/);
    assert.doesNotMatch(css, /font-family:\s*ui-monospace,\s*SFMono-Regular/);
});
