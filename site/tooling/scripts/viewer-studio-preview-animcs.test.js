const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('viewer studio preview payload includes compiled anim fields', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.match(viewer, /compiledAnims/);
    assert.match(viewer, /animCompileErrors/);
    assert.match(viewer, /animBridge/);
});

test('viewer injects animcs resolver for studio preview embeds', () => {
    const viewerPath = path.resolve('site/pages/viewer.html');
    const viewer = fs.readFileSync(viewerPath, 'utf8');

    assert.match(viewer, /__ANIMCS_RESOLVE_ENTRY/);
});
