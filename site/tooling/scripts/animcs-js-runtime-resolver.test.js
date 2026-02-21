const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('animcs runtime supports global studio resolver fallback', () => {
    const runtimePath = path.resolve('site/assets/js/animcs-js-runtime.js');
    const runtimeCode = fs.readFileSync(runtimePath, 'utf8');

    assert.match(runtimeCode, /globalThis\.__ANIMCS_RESOLVE_ENTRY/);
});

test('animcs runtime can surface resolver-side compile diagnostics', () => {
    const runtimePath = path.resolve('site/assets/js/animcs-js-runtime.js');
    const runtimeCode = fs.readFileSync(runtimePath, 'utf8');

    assert.match(runtimeCode, /compile diagnostics/i);
});
