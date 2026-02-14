const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readFolderPageHtml() {
    const htmlPath = path.resolve('site/pages/folder.html');
    return fs.readFileSync(htmlPath, 'utf8');
}

test('folder page removes inner search controls and keeps only topbar search', () => {
    const html = readFolderPageHtml();

    assert.doesNotMatch(html, /id="doc-search"/);
    assert.doesNotMatch(html, /id="search-btn"/);
    assert.doesNotMatch(html, /id="search-results"/);
    assert.doesNotMatch(html, /function\s+initSearchFunctionality\s*\(/);
    assert.doesNotMatch(html, /<script\s+src="\/site\/assets\/js\/search\.js"><\/script>/);
});

test('folder page removes grid/list toggle controls', () => {
    const html = readFolderPageHtml();

    assert.doesNotMatch(html, /id="grid-view-btn"/);
    assert.doesNotMatch(html, /id="list-view-btn"/);
    assert.doesNotMatch(html, /class="view-toggle"/);
    assert.doesNotMatch(html, /function\s+initializeViewToggle\s*\(/);
    assert.doesNotMatch(html, /function\s+syncDocViewToggleState\s*\(/);
});

test('folder page renders filtered docs in list tree only', () => {
    const html = readFolderPageHtml();

    const fnStart = html.indexOf('function updateDocumentGridWithFilteredDocs(filteredDocs)');
    const fnEnd = html.indexOf('function renderDocTree(docGrid, docs, basePath)', fnStart);
    const fnBody = fnStart >= 0 && fnEnd > fnStart ? html.slice(fnStart, fnEnd) : '';

    assert.notEqual(fnBody, '', 'updateDocumentGridWithFilteredDocs should exist');
    assert.match(fnBody, /docGrid\.classList\.add\('tree-view'\)/);
    assert.match(fnBody, /renderDocTree\s*\(/);
    assert.doesNotMatch(fnBody, /renderDocCardGrid\s*\(/);
});
