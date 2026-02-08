const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagesDir = path.resolve('site/pages');
const contentIndexPath = path.resolve('site/content/index.html');
const pageFiles = fs.readdirSync(pagesDir)
    .filter((name) => name.endsWith('.html'))
    .sort();

function readPage(fileName) {
    return fs.readFileSync(path.join(pagesDir, fileName), 'utf8');
}

function readContentIndex() {
    return fs.readFileSync(contentIndexPath, 'utf8');
}

test('all site/pages html include favicon link', () => {
    for (const fileName of pageFiles) {
        const html = readPage(fileName);
        assert.match(
            html,
            /<link\s+rel="icon"/,
            fileName + ' should include a favicon link'
        );
    }
});

test('pages with accent selector include accent-theme script', () => {
    for (const fileName of pageFiles) {
        const html = readPage(fileName);
        if (!/id="accent-select"/.test(html)) continue;

        assert.match(
            html,
            /<script\s+src="\/site\/assets\/js\/accent-theme\.js"><\/script>/,
            fileName + ' should include accent-theme.js when accent selector exists'
        );
    }
});

test('site/pages html should use folder.html for docs links', () => {
    const brokenPages = [];

    for (const fileName of pageFiles) {
        const html = readPage(fileName);
        if (/href="index\.html"/.test(html) || /href='index\.html'/.test(html)) {
            brokenPages.push(fileName);
        }
    }

    assert.deepEqual(
        brokenPages,
        [],
        'these pages still point docs links to missing index.html: ' + brokenPages.join(', ')
    );
});

test('site/content index should route docs to /site/pages/viewer.html', () => {
    const html = readContentIndex();

    assert.doesNotMatch(
        html,
        /href="viewer\.html\?file=/,
        'site/content/index.html should not link to viewer.html relative path'
    );
    assert.doesNotMatch(
        html,
        /`viewer\.html\?file=\$\{/,
        'site/content/index.html should not generate relative viewer links in scripts'
    );
    assert.match(
        html,
        /\/site\/pages\/viewer\.html\?file=/,
        'site/content/index.html should link to /site/pages/viewer.html'
    );
});
