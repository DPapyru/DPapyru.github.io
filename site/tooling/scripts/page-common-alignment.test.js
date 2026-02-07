const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagesDir = path.resolve('site/pages');
const pageFiles = fs.readdirSync(pagesDir)
    .filter((name) => name.endsWith('.html'))
    .sort();

function readPage(fileName) {
    return fs.readFileSync(path.join(pagesDir, fileName), 'utf8');
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
