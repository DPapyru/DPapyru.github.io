const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagesDir = path.resolve('site/pages');
const contentIndexPath = path.resolve('site/content/index.html');
const pageFiles = fs.readdirSync(pagesDir)
    .filter((name) => name.endsWith('.html'))
    .sort();
const unifiedHeaderPages = [
    'site/index.html',
    'site/qa.html',
    'site/404.html',
    'site/search-results.html',
    'site/content/index.html',
    'site/pages/viewer.html',
    'site/pages/folder.html',
    'site/pages/shader-playground.html',
    'site/pages/shader-gallery.html',
    'site/pages/shader-contribute.html'
];

function readPage(fileName) {
    return fs.readFileSync(path.join(pagesDir, fileName), 'utf8');
}

function readContentIndex() {
    return fs.readFileSync(contentIndexPath, 'utf8');
}

function readRelativeHtml(relativePath) {
    return fs.readFileSync(path.resolve(relativePath), 'utf8');
}

function extractHeader(html, pagePath) {
    const match = html.match(/<header class="site-header">[\s\S]*?<\/header>/);
    assert.ok(match, pagePath + ' should include site-header block');
    return match[0];
}

function normalizeHtml(html) {
    return html
        .replace(/\r/g, '')
        .replace(/>\s+</g, '><')
        .replace(/\s+/g, ' ')
        .trim();
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

test('tutorial header pages should use unified topbar layout', () => {
    const headers = unifiedHeaderPages.map((relativePath) => {
        const html = readRelativeHtml(relativePath);
        const header = extractHeader(html, relativePath);
        return {
            relativePath,
            header,
            normalized: normalizeHtml(header)
        };
    });

    const baseline = headers[0].normalized;
    for (const entry of headers) {
        assert.equal(
            entry.normalized,
            baseline,
            entry.relativePath + ' should match the exact unified header template'
        );
        assert.doesNotMatch(
            entry.header,
            /nav-link\s+active|aria-current="page"/,
            entry.relativePath + ' should not include per-page active nav state'
        );
        assert.match(
            entry.header,
            /<button class="header-search-button"[^>]*>[\s\S]*?<i class="icon-search" aria-hidden="true"><\/i>[\s\S]*?<\/button>/,
            entry.relativePath + ' should use mono icon search button instead of text/unicode'
        );
    }
});
