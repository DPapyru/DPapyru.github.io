const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('style.css keeps Markdown table alignment attributes effective', () => {
    const cssPath = path.resolve(__dirname, '..', 'assets/css/style.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.match(css, /\.markdown-content\s+th\[align="center"\]/);
    assert.match(css, /\.markdown-content\s+td\[align="center"\]/);
    assert.match(css, /\.markdown-content\s+th\[align="right"\]/);
    assert.match(css, /\.markdown-content\s+td\[align="right"\]/);
});

