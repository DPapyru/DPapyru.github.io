const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const targetPages = [
    'site/index.html',
    'site/qa.html',
    'site/404.html',
    'site/search-results.html',
    'site/pages/anim-renderer.html',
    'site/pages/article-studio.html',
    'site/pages/folder.html',
    'site/pages/shader-contribute.html',
    'site/pages/shader-gallery.html',
    'site/pages/shader-playground.html',
    'site/pages/viewer.html'
];

function readHtml(relativePath) {
    const filePath = path.resolve(relativePath);
    return fs.readFileSync(filePath, 'utf8');
}

test('all target templates use workbench-page on body', () => {
    targetPages.forEach((relativePath) => {
        const html = readHtml(relativePath);
        assert.match(
            html,
            /<body[^>]*class="[^"]*\bworkbench-page\b[^"]*"/,
            relativePath + ' should include workbench-page on body'
        );
    });
});

test('all target templates use workbench-main on main', () => {
    targetPages.forEach((relativePath) => {
        const html = readHtml(relativePath);
        assert.match(
            html,
            /<main[^>]*class="[^"]*\bworkbench-main\b[^"]*"/,
            relativePath + ' should include workbench-main on main'
        );
    });
});

test('all target templates include a workbench statusbar', () => {
    targetPages.forEach((relativePath) => {
        const html = readHtml(relativePath);
        assert.match(
            html,
            /<div[^>]*class="[^"]*\bworkbench-statusbar\b[^"]*"[^>]*>/,
            relativePath + ' should include workbench-statusbar'
        );
    });
});
