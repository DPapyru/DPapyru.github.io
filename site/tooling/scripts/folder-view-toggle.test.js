const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readFolderPageHtml() {
    const htmlPath = path.resolve('site/pages/folder.html');
    return fs.readFileSync(htmlPath, 'utf8');
}

test('folder page renders metadata-first shell with sidebar and article panel', () => {
    const html = readFolderPageHtml();

    assert.match(html, /<body class="workbench-page folder-catalog-page">/);
    assert.match(html, /id="folder-layout"/);
    assert.match(html, /id="folder-sidebar"/);
    assert.match(html, /id="folder-article-panel"/);
    assert.match(html, /id="folder-folder-tree"/);
    assert.match(html, /id="folder-article-list"/);
});

test('folder page includes local search and sort controls in panel toolbar', () => {
    const html = readFolderPageHtml();

    assert.match(html, /id="folder-search-input"/);
    assert.match(html, /id="folder-sort-select"/);
    assert.match(html, /id="folder-current-path"/);
    assert.match(html, /id="folder-total-count"/);
});

test('folder page uses learn-tree navigation contract for sidebar', () => {
    const html = readFolderPageHtml();

    assert.match(html, /learn-tree-root/);
    assert.match(html, /learn-tree-folder/);
    assert.match(html, /learn-tree-file/);
    assert.match(html, /learn-tree-toggle/);
    assert.match(html, /viewer\.html\?file=/);
    assert.doesNotMatch(html, /folder-tree-item/);
});

test('folder page no longer uses svg-only map contracts', () => {
    const html = readFolderPageHtml();

    assert.doesNotMatch(html, /id="folder-map-svg"/);
    assert.doesNotMatch(html, /function\s+renderMap\s*\(/);
    assert.doesNotMatch(html, /function\s+drawNode\s*\(/);
});
