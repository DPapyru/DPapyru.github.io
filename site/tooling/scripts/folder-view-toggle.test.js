const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readFolderPageHtml() {
    const htmlPath = path.resolve('site/pages/folder.html');
    return fs.readFileSync(htmlPath, 'utf8');
}

test('folder page keeps explicit current doc view state', () => {
    const html = readFolderPageHtml();

    assert.match(html, /let\s+CURRENT_DOC_VIEW\s*=\s*['"]grid['"]/);
});

test('folder page renders card grid and tree list by view mode', () => {
    const html = readFolderPageHtml();

    const fnStart = html.indexOf('function updateDocumentGridWithFilteredDocs(filteredDocs)');
    const fnEnd = html.indexOf('function renderDocTree(docGrid, docs, basePath)', fnStart);
    const fnBody = fnStart >= 0 && fnEnd > fnStart ? html.slice(fnStart, fnEnd) : '';

    assert.notEqual(fnBody, '', 'updateDocumentGridWithFilteredDocs should exist');
    assert.match(fnBody, /if\s*\(CURRENT_DOC_VIEW\s*===\s*['"]list['"]\)/);
    assert.match(fnBody, /renderDocTree\s*\(/);
    assert.match(fnBody, /renderDocCardGrid\s*\(/);
});

test('folder view toggle click rerenders with current filters', () => {
    const html = readFolderPageHtml();

    const fnStart = html.indexOf('function initFilterAndSortFunctionality()');
    const fnEnd = html.indexOf('function populateCategoryFilter()', fnStart);
    const fnBody = fnStart >= 0 && fnEnd > fnStart ? html.slice(fnStart, fnEnd) : '';

    assert.notEqual(fnBody, '', 'initFilterAndSortFunctionality should exist');
    assert.match(fnBody, /CURRENT_DOC_VIEW\s*=\s*['"]grid['"]/);
    assert.match(fnBody, /CURRENT_DOC_VIEW\s*=\s*['"]list['"]/);
    assert.match(fnBody, /gridViewBtn\.addEventListener\(\s*['"]click['"]/);
    assert.match(fnBody, /listViewBtn\.addEventListener\(\s*['"]click['"]/);
    assert.match(fnBody, /applyAllFiltersAndSort\(\)/);
});
