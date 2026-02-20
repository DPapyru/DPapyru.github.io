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

test('folder page renders filtered docs through svg map only', () => {
    const html = readFolderPageHtml();

    assert.match(html, /id="folder-map-svg"/);
    assert.match(html, /function\s+renderMap\s*\(/);
    assert.match(html, /function\s+drawNode\s*\(/);
    assert.doesNotMatch(html, /function\s+updateDocumentGridWithFilteredDocs\s*\(/);
    assert.doesNotMatch(html, /function\s+renderDocCardGrid\s*\(/);
    assert.doesNotMatch(html, /function\s+renderDocTree\s*\(/);
});
