const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('shader playground page includes embedded contribute panel assets', () => {
    const file = path.resolve('site/pages/shader-playground.html');
    const text = fs.readFileSync(file, 'utf8');

    assert.match(text, /\/site\/assets\/css\/shader-contribute\.css/);
    assert.match(text, /id="shaderpg-contribute-panel"/);
    assert.match(text, /id="shader-contribute-template"/);
    assert.match(text, /id="shader-contribute-submit-pr"/);
    assert.match(text, /\/site\/assets\/js\/shader-contribute\.js/);
});

test('shader playground contribute button no longer navigates away', () => {
    const file = path.resolve('site/assets/js/shader-playground.js');
    const text = fs.readFileSync(file, 'utf8');

    assert.doesNotMatch(text, /window\.location\.href\s*=\s*'shader-contribute\.html'/);
    assert.match(text, /shaderpg-contribute-panel/);
});

test('shader playground help drawer updates aria-hidden on open/close', () => {
    const file = path.resolve('site/assets/js/shader-playground.js');
    const text = fs.readFileSync(file, 'utf8');

    assert.match(text, /function openHelpDrawer\(\)\s*\{[\s\S]*helpDrawer\.setAttribute\('aria-hidden',\s*'false'\)/);
    assert.match(text, /function closeHelpDrawer\(\)\s*\{[\s\S]*helpDrawer\.setAttribute\('aria-hidden',\s*'true'\)/);
});

test('shader playground compile status reports failure when compile errors exist', () => {
    const file = path.resolve('site/assets/js/shader-playground.js');
    const text = fs.readFileSync(file, 'utf8');

    assert.match(text, /function compileAll\(reason\)\s*\{[\s\S]*let hasCompileError = false;/);
    assert.match(text, /if \(!res\.ok\) \{[\s\S]*hasCompileError = true;/);
    assert.match(text, /setStatus\(\(hasCompileError\s*\?\s*'编译失败'/);
});
