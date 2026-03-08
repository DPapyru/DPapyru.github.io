const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readFolderHtml() {
    return fs.readFileSync(path.resolve('site/pages/folder.html'), 'utf8');
}

test('folder page script defines metadata-first indexing and rendering functions', () => {
    const html = readFolderHtml();

    assert.match(html, /function\s+normalizeDoc\s*\(/);
    assert.match(html, /function\s+buildFolderIndex\s*\(/);
    assert.match(html, /function\s+renderFolderTree\s*\(/);
    assert.match(html, /function\s+renderArticleList\s*\(/);
});

test('folder page article rendering includes markdown metadata fields with prefix support', () => {
    const html = readFolderHtml();

    assert.match(html, /doc\.description/);
    assert.match(html, /doc\.author/);
    assert.match(html, /doc\.time/);
    assert.match(html, /doc\.difficulty/);
    assert.match(html, /doc\.prefix/);
    assert.doesNotMatch(html, /doc\.prev_chapter/);
    assert.doesNotMatch(html, /doc\.next_chapter/);
});

test('folder page keeps viewer links based on markdown path', () => {
    const html = readFolderHtml();

    assert.match(html, /viewer\.html\?file=/);
    assert.match(html, /encodeURIComponent\(doc\.path\)/);
});

test('folder page persists article panel progress by query context', () => {
    const html = readFolderHtml();

    assert.match(html, /folderArticlePanelProgress:v1/);
    assert.match(html, /function\s+buildArticleProgressKey\s*\(/);
    assert.match(html, /function\s+saveArticlePanelProgress\s*\(/);
    assert.match(html, /function\s+restoreArticlePanelProgress\s*\(/);
    assert.match(html, /refs\.list\.addEventListener\('scroll'/);
});

test('folder page supports nested folder-group rendering for subdirectories', () => {
    const html = readFolderHtml();

    assert.match(html, /function\s+buildGroupedDocsTree\s*\(/);
    assert.match(html, /function\s+renderGroupSection\s*\(/);
    assert.match(html, /folder-group-children/);
    assert.match(html, /section\.dataset\.depth/);
});

test('folder page supports collapsible folder-group with persisted state', () => {
    const html = readFolderHtml();

    assert.match(html, /folderGroupCollapse:v1/);
    assert.match(html, /function\s+buildGroupCollapseKey\s*\(/);
    assert.match(html, /function\s+saveGroupCollapsedState\s*\(/);
    assert.match(html, /section\.dataset\.collapsed/);
    assert.match(html, /header\.addEventListener\('click',\s*onGroupToggle\)/);
    assert.match(html, /folder-group\[data-collapsed=\"1\"\]\s*>\s*\.folder-group-body/);
});

test('folder tree row toggles collapse and uses dedicated folder view action', () => {
    const html = readFolderHtml();

    assert.match(html, /row\.addEventListener\('click',\s*onToggle\)/);
    assert.match(html, /toggle\.addEventListener\('click',\s*onToggle\)/);
    assert.match(html, /learn-tree-open-folder/);
});
