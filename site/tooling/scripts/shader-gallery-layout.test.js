const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readCss() {
    const cssPath = path.resolve('site/assets/css/shader-gallery.css');
    return fs.readFileSync(cssPath, 'utf8');
}

test('shader gallery grid collapses empty tracks for sparse cards', () => {
    const css = readCss();

    assert.match(
        css,
        /\.shader-gallery-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(/,
        'shader-gallery grid should use auto-fit to avoid empty phantom columns'
    );

    assert.match(
        css,
        /\.shader-gallery-grid\s*\{[\s\S]*justify-content:\s*start\s*;/,
        'shader-gallery grid should align cards from start without stretching empty space'
    );
});
